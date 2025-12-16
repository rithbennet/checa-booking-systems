# Validation Error Handling Guide

This document explains how validation errors are handled in CHECA, ensuring consistent error responses and proper separation of concerns.

---

## Overview

- **ValidationError**: Custom error class for validation failures that should return HTTP 400
- **Zod Schemas**: Located in `entities/<entity>/model/schemas.ts` following Feature-Sliced Design
- **Repository Pattern**: Validate with zod, throw `ValidationError` on failure
- **API Route Pattern**: Catch `ValidationError` and return 400 status with error details

---

## 1. ValidationError Class

**Location**: `src/shared/server/errors.ts`

```typescript
export class ValidationError extends Error {
  constructor(
    public error: string,
    public details?: Record<string, string[]>,
  ) {
    super(error);
    this.name = "ValidationError";
  }
}
```

**Properties**:
- `error`: Main error message (string)
- `details`: Optional field-level errors (Record<string, string[]>)

**Purpose**: Distinguish validation errors from other errors so API routes can return 400 instead of 500.

---

## 2. Schema Organization (Following AGENTS.md)

### Where Schemas Live

**Rule**: Zod schemas belong in the `model` layer of entities, not in repositories or API routes.

**Location Pattern**: `src/entities/<entity>/model/schemas.ts`

**Example**: `src/entities/user/model/schemas.ts`

```typescript
import { z } from "zod";

/**
 * Schema for validating profile update input
 */
export const updateProfileInputSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name cannot be empty")
    .trim()
    .optional(),
  lastName: z
    .string()
    .min(1, "Last name cannot be empty")
    .trim()
    .optional(),
  phone: z.string().trim().nullable().optional(),
  userIdentifier: z.string().trim().optional(),
  supervisorName: z.string().trim().nullable().optional(),
  facultyId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  ikohzaId: z.string().uuid().nullable().optional(),
  companyId: z.string().uuid().nullable().optional(),
  companyBranchId: z.string().uuid().nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
```

**Benefits**:
- Single source of truth for validation rules
- Reusable across repositories and API routes
- Type safety with `z.infer<>`

---

## 3. Repository Pattern

**Location**: `src/entities/<entity>/server/*.ts`

Repositories should:
1. Import zod schemas from `../model/schemas`
2. Validate input using `safeParse()`
3. Throw `ValidationError` (not generic `Error`) on validation failure
4. Use validated data for database operations

### Example: Profile Repository

**File**: `src/entities/user/server/profile-repository.ts`

```typescript
import { db } from "@/shared/server/db";
import { ValidationError } from "@/shared/server/errors";
import type { UpdateProfileInput } from "../model/schemas";
import { updateProfileInputSchema } from "../model/schemas";

export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<UserProfileVM | null> {
  // 1. Validate input using zod schema
  const validationResult = updateProfileInputSchema.safeParse(input);
  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;
    const errorMessage =
      validationResult.error.errors[0]?.message || "Validation failed";
    
    // 2. Throw ValidationError (not generic Error)
    throw new ValidationError(errorMessage, fieldErrors);
  }

  // 3. Use validated data
  const validatedInput = validationResult.data;

  // 4. Perform database operation
  const user = await db.user.update({
    where: { id: userId },
    data: {
      ...(validatedInput.firstName !== undefined && {
        firstName: validatedInput.firstName,
      }),
      // ... other fields
    },
    include: { /* ... */ },
  });

  // 5. Return view model
  return {
    id: user.id,
    firstName: user.firstName,
    // ...
  };
}
```

**Key Points**:
- ✅ Use `safeParse()` to validate
- ✅ Throw `ValidationError` with message and field errors
- ✅ Use validated data (not raw input) for DB operations
- ❌ Don't return Response objects from repositories
- ❌ Don't throw generic `Error` for validation failures

---

## 4. API Route Pattern

**Location**: `src/app/api/**/route.ts`

API routes should:
1. Validate request body with zod (route-level validation)
2. Catch `ValidationError` from repository/service calls
3. Return HTTP 400 with error details
4. Handle other errors appropriately

### Standard Pattern

```typescript
import { ValidationError } from "@/shared/server/errors";
import { someSchema } from "@/entities/some-entity/model/schemas";

export const PATCH = createProtectedHandler(
  async (req, user) => {
    try {
      // 1. Parse and validate request body
      const body = await req.json();
      const result = someSchema.safeParse(body);

      if (!result.success) {
        return Response.json(
          {
            error: "Validation failed",
            details: result.error.flatten().fieldErrors,
          },
          { status: 400 },
        );
      }

      const data = result.data;

      // 2. Call repository/service (may throw ValidationError)
      const output = await someRepositoryFunction(user.id, data);

      return Response.json(output);
    } catch (error) {
      // 3. Handle ValidationError FIRST (returns 400)
      if (error instanceof ValidationError) {
        return Response.json(
          {
            error: error.error,
            ...(error.details && { details: error.details }),
          },
          { status: 400 },
        );
      }

      // 4. Handle other specific errors...
      // 5. Re-throw to let createProtectedHandler handle unknown errors
      throw error;
    }
  },
);
```

### Example: User Profile API

**File**: `src/app/api/user/profile/route.ts`

```typescript
import { z } from "zod";
import { updateProfileInputSchema } from "@/entities/user/model/schemas";
import { updateUserProfile } from "@/entities/user/server/profile-repository";
import { createProtectedHandler } from "@/shared/lib/api-factory";
import { ValidationError } from "@/shared/server/errors";

// Extend base schema with route-specific fields
const updateProfileSchema = updateProfileInputSchema.extend({
  newBranchName: z.string().trim().optional(),
  newBranchAddress: z.string().trim().optional(),
});

export const PATCH = createProtectedHandler(
  async (req, user) => {
    try {
      const body = await req.json();
      const result = updateProfileSchema.safeParse(body);

      if (!result.success) {
        return Response.json(
          {
            error: "Validation failed",
            details: result.error.flatten().fieldErrors,
          },
          { status: 400 },
        );
      }

      const data = result.data;

      // Route-specific logic (e.g., create branch)
      let finalBranchId = data.companyBranchId;
      if (data.companyId && !data.companyBranchId && data.newBranchName) {
        const newBranch = await createCompanyBranch({
          companyId: data.companyId,
          name: data.newBranchName,
          address: data.newBranchAddress,
        });
        finalBranchId = newBranch.id;
      }

      // Call repository (may throw ValidationError)
      const profile = await updateUserProfile(user.id, {
        ...data,
        companyBranchId: finalBranchId,
      });

      if (!profile) {
        return Response.json({ error: "Profile not found" }, { status: 404 });
      }

      return profile;
    } catch (error) {
      // Catch ValidationError from repository
      if (error instanceof ValidationError) {
        return Response.json(
          {
            error: error.error,
            ...(error.details && { details: error.details }),
          },
          { status: 400 },
        );
      }
      // Re-throw other errors
      throw error;
    }
  },
  { requireActive: false },
);
```

**Key Points**:
- ✅ Validate request body at route level
- ✅ Catch `ValidationError` before other errors
- ✅ Return 400 with structured error response
- ✅ Extend base schemas for route-specific fields
- ❌ Don't let `ValidationError` reach `createProtectedHandler` (it returns 500)

---

## 5. Error Response Format

### Success Response
```json
{
  "id": "123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Validation Error Response (400)
```json
{
  "error": "First name cannot be empty",
  "details": {
    "firstName": ["First name cannot be empty"],
    "lastName": ["Last name cannot be empty"]
  }
}
```

### Single Field Error
```json
{
  "error": "Rejection reason is required",
  "details": {
    "notes": ["Rejection reason is required"]
  }
}
```

---

## 6. Routes Using This Pattern

All these routes now consistently handle `ValidationError`:

- ✅ `src/app/api/user/profile/route.ts`
- ✅ `src/app/api/user/profile-image/route.ts`
- ✅ `src/app/api/auth/register/route.ts`
- ✅ `src/app/api/auth/complete-onboarding/route.ts`
- ✅ `src/app/api/user/modifications/route.ts`
- ✅ `src/app/api/admin/modifications/route.ts`
- ✅ `src/app/api/admin/finance/payments/[paymentId]/reject/route.ts`
- ✅ `src/app/api/bookings/[id]/route.ts`
- ✅ `src/app/api/bookings/[id]/submit/route.ts` (uses `BookingValidationError`)

---

## 7. Decision Tree

### When to Use What

**Use zod + ValidationError in repositories/services**:
- ✅ Business logic validation
- ✅ Data integrity checks
- ✅ Server-side validation rules
- ✅ Throw `ValidationError` with meaningful messages

**Use zod + HTTP 400 in API routes**:
- ✅ Request body shape validation
- ✅ Catching `ValidationError` from repositories
- ✅ Returning structured error responses
- ✅ Route-specific validation (extend base schemas)

**Don't**:
- ❌ Throw generic `Error` for validation failures
- ❌ Put zod schemas in repositories (use `model/schemas.ts`)
- ❌ Return Response objects from repositories
- ❌ Let `ValidationError` reach `createProtectedHandler` (it returns 500)

---

## 8. Benefits

1. **Consistent Error Handling**: All validation errors return 400 status codes
2. **Better Client Experience**: Clients can distinguish validation errors from server errors
3. **Type Safety**: Zod schemas provide TypeScript types automatically
4. **Maintainability**: Clear separation between validation logic and API handling
5. **Future-Proof**: Ready for when repository functions use `ValidationError`
6. **Reusability**: Schemas can be shared between routes and repositories

---

## 9. Quick Reference

### Creating a New Schema

1. Create `src/entities/<entity>/model/schemas.ts`:
```typescript
import { z } from "zod";

export const myEntitySchema = z.object({
  field: z.string().min(1, "Field is required"),
});

export type MyEntityInput = z.infer<typeof myEntitySchema>;
```

2. Use in repository:
```typescript
import { myEntitySchema } from "../model/schemas";

const result = myEntitySchema.safeParse(input);
if (!result.success) {
  throw new ValidationError("Validation failed", result.error.flatten().fieldErrors);
}
```

3. Use in API route:
```typescript
import { myEntitySchema } from "@/entities/<entity>/model/schemas";
import { ValidationError } from "@/shared/server/errors";

try {
  const result = myEntitySchema.safeParse(body);
  // ... handle validation
  await repositoryFunction(data);
} catch (error) {
  if (error instanceof ValidationError) {
    return Response.json({ error: error.error, details: error.details }, { status: 400 });
  }
  throw error;
}
```

---

## 10. Related Documentation

- [AGENTS.md](.cursor/AGENTS.md) - Feature-Sliced Design patterns
- [api-security.md](src/shared/server/api-security.md) - API security guidelines

