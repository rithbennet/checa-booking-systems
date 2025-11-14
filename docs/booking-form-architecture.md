# Booking Form Architecture

## Overview

The booking form has been refactored to follow a **RHF-first (React Hook Form first)** architecture where React Hook Form is the single source of truth for all form field state. This document explains the new architecture, state management approach, and migration from the old Zustand-heavy pattern.

## Core Principles

1. **React Hook Form (RHF) is the Single Source of Truth**: All form field data lives exclusively in RHF, not in Zustand or any other state management solution.

2. **Zod Schemas Define Validation**: All validation rules, business logic constraints, and type definitions come from Zod schemas in `src/entities/booking/model/schemas.ts`.

3. **Zustand for Wizard/Meta State Only**: Zustand is used exclusively for UI state (current step, dialog visibility) and metadata (draft ID, last saved timestamp), never for form fields.

4. **Explicit Draft Management**: Drafts are saved and loaded explicitly via a draft service, keyed by `userId-mode-bookingId`.

5. **Clean Remounts**: The BookingPage component remounts when user/mode/bookingId changes via a React `key` prop.

## Architecture Components

### 1. Zod Schemas (`src/entities/booking/model/schemas.ts`)

**Purpose**: Single source of truth for validation, types, and business rules.

**Key Features**:
- Category-aware validation (working_space vs testing services)
- Cross-field refinements (e.g., endDate > startDate)
- Quantity rules (working_space can be 0, testing must be >= 1)
- Duration rules (working_space requires durationMonths >= 1)

**Exports**:
```typescript
export const createBookingInputSchema = z.object({ /* ... */ })
export type CreateBookingInput = z.infer<typeof createBookingInputSchema>
```

### 2. Domain Factories (`src/entities/booking/lib/factories.ts`)

**Purpose**: Pure functions for creating and normalizing booking data.

**Functions**:
- `createDefaultServiceItem(service, now?)`: Creates a default service item with category-aware defaults
- `createDefaultWorkspaceBooking(now?)`: Creates a default workspace booking
- `normalizeServiceItem(item, service?)`: Ensures all required fields have defaults
- `normalizeBookingInput(input)`: Normalizes partial input to full CreateBookingInput
- `attachMetadataForValidation(input, services)`: Enriches items with service category for validation

**Why Pure Functions?**: No dependencies on stores or context, making them easy to test and reuse.

### 3. Draft Service (`src/entities/booking/lib/draftService.ts`)

**Purpose**: Manages draft persistence to localStorage.

**Functions**:
- `draftKey(userId, mode, bookingId?)`: Generates unique draft key
- `getDraft<T>(key)`: Retrieves and deserializes draft (with Date revival)
- `saveDraft<T>(key, data)`: Serializes and saves draft
- `clearDraft(key)`: Removes specific draft
- `clearAllUserDrafts(userId)`: Removes all drafts for a user

**Key Feature**: Date objects are automatically revived when loading drafts.

### 4. Wizard Store (`src/features/booking-form/model/use-booking-wizard-store.ts`)

**Purpose**: Manages wizard UI state and metadata only.

**State**:
```typescript
{
  currentStep: number;              // 1-4
  isServiceDialogOpen: boolean;     // UI state
  draftId?: string;                 // Optional draft identifier
  lastSavedAt?: number;             // Timestamp of last save
}
```

**Actions**:
- `setCurrentStep(n)`
- `setServiceDialogOpen(b)`
- `setDraftId(id?)`
- `markSaved(ts)`
- `resetWizard()`
- `clearPersistAndRehydrate()`: Clears persisted state (used on logout)

**What's NOT in this store**: Form fields, services, service items, billing info, etc.

### 5. Booking Form Hook (`src/features/booking-form/lib/use-booking-form.ts`)

**Purpose**: Business logic for the booking form, orchestrating RHF, validation, and mutations.

**Architecture**:
```typescript
useBookingForm({
  userType,
  userStatus,
  services,           // Array of available services
  profile,            // User profile for billing prefill
  initialDraft,       // Optional draft loaded from storage
  initialServices,    // Optional services to seed form
  draftKey,           // Key for saving drafts
})
```

**Key Features**:
- Builds `servicesMap` via `useMemo` for efficient lookups
- Constructs `defaultValues` from: base → draft → initialServices → profile
- Uses `useForm` with Zod resolver
- Uses `useFieldArray` for service items and workspace bookings
- Handlers manipulate RHF arrays directly (no store updates)
- `handleSaveDraft()` calls draft service and marks timestamp in wizard store
- `onSubmit()` enriches data with metadata, submits, clears draft, and resets wizard

**No Store Mirroring**: Removed all `useEffect` hooks that synced store → form. RHF is the only source of field data.

### 6. Booking Page (`src/widgets/booking-page/ui/BookingPage.tsx`)

**Purpose**: Client component that wires everything together.

**Props**:
```typescript
{
  userId: string;           // Required for draft key
  userType,
  userStatus,
  services,
  equipment,
  profile,
  mode?: "new" | "edit";    // For draft key
  bookingId?: string;       // For draft key in edit mode
}
```

**Key Logic**:
```typescript
const currentDraftKey = useMemo(() => draftKey(userId, mode, bookingId), [userId, mode, bookingId])
const initialDraft = useMemo(() => getDraft<Partial<CreateBookingInput>>(currentDraftKey), [currentDraftKey])
const bookingForm = useBookingForm({ services, profile, initialDraft, draftKey: currentDraftKey, ... })
```

**Remount Strategy**: The parent page component passes a `key` prop:
```typescript
const bookingKey = `${userId}-${mode}-${bookingId ?? "new"}`
return <BookingPage key={bookingKey} userId={userId} ... />
```

This ensures clean remounts when user/mode/bookingId changes.

### 7. Server Component Page (`src/app/(main)/bookings/new/page.tsx`)

**Purpose**: Fetches data server-side and renders BookingPage with proper key.

**Data Fetching**:
- User session → `userId`, `userType`, `userStatus`
- Invoice profile → billing prefill
- Services (filtered by userType)
- Available equipment

**Key Generation**: `${userId}-${mode}-new`

## Data Flow

### Initial Load
1. Server component fetches services, equipment, profile, and session
2. Server component computes `userId`, `mode`, and `bookingKey`
3. Renders `<BookingPage key={bookingKey} userId={userId} ... />`
4. BookingPage computes `draftKey` and loads `initialDraft` via `getDraft()`
5. `useBookingForm` builds `defaultValues`: `base → draft → initialServices → profile`
6. RHF initializes with `defaultValues`

### User Interaction
1. User modifies fields → RHF state updates
2. User navigates steps → wizard store `currentStep` updates
3. User clicks "Save Draft" → `handleSaveDraft()` calls `saveDraft(draftKey, form.getValues())` and `markSaved(Date.now())`
4. User submits → `onSubmit()` enriches data, submits mutation, clears draft, resets wizard, redirects

### Logout
1. User triggers logout → `SignOutModal` opens
2. Modal calls `clearPersistAndRehydrate()` to clear wizard store
3. Modal calls `clearAllUserDrafts(userId)` to clear all user's drafts
4. Modal signs out and redirects

## Migration Notes

### What Changed
- **Old**: Form data and services lived in Zustand (`useBookingStore`)
- **New**: Form data lives in RHF, only wizard/meta in Zustand (`useBookingWizardStore`)

- **Old**: `useEffect` synced store → form (dual source of truth)
- **New**: No syncing; RHF is the only source of truth

- **Old**: Drafts implicitly saved in Zustand persistence
- **New**: Drafts explicitly saved via `draftService` with user-specific keys

- **Old**: Store persisted after logout
- **New**: Drafts and wizard state cleared on logout

### Migration Complete ✅
The old `useBookingStore` has been fully removed. ServicesPage now navigates with service ID in URL params (`/bookings/new?serviceId=xxx`), and the booking wizard adds the service to RHF directly on first load.

## Benefits

1. **No Dual State**: RHF is the only source of form field truth → no sync bugs
2. **Explicit Drafts**: Drafts are keyed and managed explicitly → no stale data after logout
3. **Clean Remounts**: Component keys ensure fresh state when context changes
4. **Type Safety**: Zod schemas provide single source of types and validation
5. **Testability**: Pure factories and services are easy to unit test
6. **Performance**: `useMemo` for expensive computations; no unnecessary re-renders

## Testing Recommendations

### Unit Tests
- `schemas.ts`: Test validation rules (working_space, testing, date ranges)
- `factories.ts`: Test default creation and normalization (idempotency, category awareness)
- `draftService.ts`: Test save/load/clear with Date revival

### Integration Tests
- Booking form flow: Add service → fill form → save draft → reload → resume → submit
- Logout flow: Create draft → logout → login → verify draft cleared
- Multi-step wizard: Navigate steps → save draft → reload → verify step restored

## Future Improvements

1. **Autosave**: Add debounced autosave with `useEffect` + `useWatch` on relevant fields
2. **Optimistic Updates**: Show "Saving..." indicator during draft saves
3. **Draft List**: Add UI to view and manage user's drafts
4. **Version Migration**: Add versioning to draft schema for backward compatibility
5. **IndexedDB**: Migrate from localStorage to IndexedDB for larger drafts

## File Structure

```
src/
├── entities/booking/
│   ├── model/schemas.ts              # Zod schemas (validation & types)
│   └── lib/
│       ├── factories.ts              # Pure domain factories
│       └── draftService.ts           # Draft persistence
├── features/booking-form/
│   ├── model/
│   │   ├── use-booking-wizard-store.ts   # NEW: Wizard/meta state
│   │   ├── use-booking-store.ts          # DEPRECATED: Old store
│   │   └── types.ts                      # Feature types
│   ├── lib/
│   │   └── use-booking-form.ts           # RHF-first hook
│   └── ui/
│       └── steps/                        # Step components
├── widgets/booking-page/
│   └── ui/BookingPage.tsx                # Client page component
└── app/(main)/bookings/new/
    └── page.tsx                          # Server page component
```

## Summary

This refactor transforms the booking form from a Zustand-heavy architecture to an RHF-first architecture where:
- **React Hook Form** owns all field state
- **Zod** defines all validation and types
- **Zustand** manages only wizard/meta state
- **Draft Service** handles explicit persistence
- **Component Keys** ensure clean remounts

The result is a more maintainable, testable, and predictable booking form with no dual-state issues or stale data after logout.
