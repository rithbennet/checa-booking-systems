# Feature-Sliced Design Architecture

This project uses a Feature-Sliced Design (FSD) architecture with a custom twist optimized for Next.js App Router.

## Folder Structure

```
src/
├── app/                    # Next.js app directory (routes, layouts, pages)
│   ├── (auth)/            # Auth routes (public)
│   ├── (main)/            # Main app routes (protected)
│   │   ├── admin/         # Admin-only routes
│   │   └── (user)/        # User routes
│   └── api/               # API route handlers
├── widgets/               # Composite UI components (combine features + entities)
├── features/              # Feature modules (self-contained functionality)
├── entities/              # Business entities (core domain models)
└── shared/                # Shared code (used across features/entities)
    ├── server/            # Server utilities, DB, auth
    ├── ui/                # Shared UI components (shadcn, primitives)
    ├── lib/               # Shared utilities
    ├── hooks/             # Shared React hooks
    ├── config/            # Shared configuration
    └── styles/            # Global styles
```

## Architecture Layers

### 1. Shared (`src/shared/`)
**Purpose**: Code used across multiple features and entities.

**Subfolders**:
- `server/` - Database connections (`db.ts`), authentication, server utilities
- `ui/` - Shared UI components (shadcn components in `ui/shadcn/`, primitives like `SearchBar`, `PaginationControls`)
- `lib/` - Utilities like date formatting, validation helpers
- `hooks/` - Shared React hooks (`use-debounce.ts`, `use-mobile.ts`)
- `config/` - Shared configuration (status maps, constants)
- `styles/` - Global CSS and styling

**Rules**:
- ❌ Should NOT depend on features or entities
- ✅ Can be used by any layer

### 2. Entities (`src/entities/`)
**Purpose**: Core business concepts and domain models. Contains data fetching logic (TanStack Query hooks).

**Structure**:
```
entities/
  entity-name/
    index.ts         # Public exports (barrel file)
    api/             # TanStack Query hooks (IMPORTANT: All queries go here)
      query-keys.ts  # Query key factory
      use-*.ts       # Query hooks
      index.ts       # API exports
    model/           # Types, interfaces, Zod schemas
      types.ts       # TypeScript types/interfaces
      query-keys.ts  # (Alternative location for query keys)
      queries.ts     # (Alternative: hooks can go here)
    server/          # Server-side data fetching (Prisma)
      repository.ts  # Database access functions
    lib/             # Entity-specific utilities
      mappers.ts     # Data transformation functions
    ui/              # Entity-specific UI components
      StatusBadge.tsx # Simple, reusable components
```

**Examples in this codebase**:
- `entities/booking/` - Booking entity with full CRUD hooks
- `entities/sample-tracking/` - Sample tracking with queries in `model/queries.ts`
- `entities/workspace-booking/` - Workspace scheduling

**Query Keys Pattern**:
```typescript
// entities/booking/api/query-keys.ts
export const bookingKeys = {
  all: ["bookings"] as const,
  adminList: (params: Record<string, unknown>) =>
    [...bookingKeys.all, "admin", "list", params] as const,
  adminDetail: (id: string) =>
    [...bookingKeys.all, "admin", "detail", id] as const,
  commandCenter: (id: string) =>
    [...bookingKeys.all, "admin", "commandCenter", id] as const,
};
```

**Rules**:
- ✅ Can depend on `@/shared/*`
- ❌ Should NOT depend on features
- Contains TanStack Query hooks for data fetching
- Represents core business concepts

### 3. Features (`src/features/`)
**Purpose**: Self-contained pieces of functionality. Contains UI components and feature-specific logic.

**Structure**:
```
features/
  feature-name/
    index.ts         # Public exports
    ui/              # Feature UI components
      ComponentA.tsx # React components
      ComponentB.tsx
    model/           # Feature types, state, schemas
      constants.ts   # Feature-specific constants
      schema.ts      # Zod validation schemas
    lib/             # Feature utilities
      helpers.ts     # Formatting, calculations
      useParams.ts   # URL parameter hooks
```

**Nested Features** (for complex features):
```
features/
  bookings/
    admin/
      details/       # Admin booking details sub-feature
        index.ts
        ui/          # UI components
        lib/         # Helpers
      list/          # Admin booking list sub-feature
    form/            # Booking form feature
    list/            # User booking list
```

**Examples in this codebase**:
- `features/operations/` - Lab operations dashboard with tabs
- `features/bookings/admin/details/` - Admin booking command center
- `features/service-selection/` - Service selection wizard

**Rules**:
- ✅ Can depend on `@/shared/*` and `@/entities/*`
- ❌ Should NOT depend on other features
- ⚠️ TanStack Query hooks should be in entities, not features
- Self-contained functionality

### 4. Widgets (`src/widgets/`)
**Purpose**: Composite UI components that combine features and entities. Used for complex page layouts.

**Structure**:
```
widgets/
  widget-name/
    ui/              # Widget UI components
    index.ts         # Public API exports
```

**Rules**:
- ✅ Can depend on shared, entities, and features
- Can be composed together
- Used in app routes/pages

### 5. App (`src/app/`)
**Purpose**: Next.js App Router directory with routes, pages, layouts, and API handlers.

**Structure**:
```
app/
  layout.tsx           # Root layout
  page.tsx             # Home page
  (auth)/              # Auth route group (public)
    layout.tsx         # Auth-specific layout
    signIn/
    register/
  (main)/              # Main app route group (protected)
    layout.tsx         # Main app layout (sidebar, header)
    admin/             # Admin routes
      bookings/
        page.tsx       # List page
        [id]/
          page.tsx     # Detail page (uses features/widgets)
  api/                 # API routes
    admin/
      bookings/
        [id]/
          route.ts           # /api/admin/bookings/:id
          command-center/
            route.ts         # /api/admin/bookings/:id/command-center
```

**API Route Pattern**:
```typescript
// app/api/admin/bookings/[id]/command-center/route.ts
import { createProtectedHandler } from "@/shared/server/protected";
import { getBookingCommandCenterData } from "@/entities/booking/server/command-center-repository";

export const GET = createProtectedHandler(
  ["lab_administrator"],
  async (req, { user, params }) => {
    const { id } = await params;
    const data = await getBookingCommandCenterData(id);
    return Response.json(data);
  }
);
```

**Rules**:
- Uses widgets and features to compose pages
- Contains route handlers and layouts
- Client components fetch data via entity hooks

## Import Paths

```typescript
import { db } from "@/shared/server/db";
import { Button } from "@/shared/ui/shadcn/button";
import { useDebounce } from "@/shared/hooks/use-debounce";

import { useBookingCommandCenter } from "@/entities/booking/api";
import { BookingStatus } from "@/entities/booking/model/types";

import { BookingCommandCenter } from "@/features/bookings/admin/details";

import { Dashboard } from "@/widgets/dashboard";
```

## Key Patterns

### 1. TanStack Query Placement
- **All TanStack Query hooks go in `entities/<entity>/api/` or `entities/<entity>/model/`**
- Features consume hooks from entities
- This ensures query cache is shared across features

### 2. Server Repository Pattern
- Server-side data fetching in `entities/<entity>/server/repository.ts`
- Uses Prisma directly
- Called by API routes

### 3. Feature Helpers
- Formatting functions in `features/<feature>/lib/helpers.ts`
- Date formatting, currency formatting, relative time
- Keeps UI components clean

### 4. Component Hierarchy
```
Page (app/)
  └── Widget or Feature Main Component
        ├── Feature Sub-components
        │     └── Entity UI (StatusBadge, etc.)
        └── Shared UI (Button, Card, etc.)
```

### 5. Index Exports
Every folder should have an `index.ts` that exports public API:
```typescript
// features/bookings/admin/details/index.ts
export * from "./lib/helpers";
export { BookingCommandCenter } from "./ui/BookingCommandCenter";
export { BookingHeader } from "./ui/BookingHeader";
// Note: TanStack hooks are in @/entities/booking/api
```

## Common File Templates

### Entity Query Hook
```typescript
// entities/<entity>/api/use<Entity>.ts
import { useQuery } from "@tanstack/react-query";
import { <entity>Keys } from "./query-keys";
import type { <EntityType> } from "../model/types";

export function use<Entity>(id: string) {
  return useQuery<EntityType>({
    queryKey: <entity>Keys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/<entity>/${id}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: Boolean(id),
  });
}
```

### Feature Component
```typescript
// features/<feature>/ui/<Component>.tsx
"use client";

import { useState } from "react";
import { use<Entity> } from "@/entities/<entity>/api";
import { Button } from "@/shared/ui/shadcn/button";
import { formatDate } from "../lib/helpers";

interface <Component>Props {
  entityId: string;
}

export function <Component>({ entityId }: <Component>Props) {
  const { data, isLoading } = use<Entity>(entityId);
  // Component implementation
}
```

### Server Repository
```typescript
// entities/<entity>/server/repository.ts
import { db } from "@/shared/server/db";
import type { <EntityVM> } from "../model/types";

export async function get<Entity>Data(id: string): Promise<<EntityVM> | null> {
  const data = await db.<entity>.findUnique({
    where: { id },
    include: { /* relations */ },
  });
  return data;
}
```

## Migration Notes

- Server code moved from `src/server/` → `src/shared/server/`
- Styles moved from `src/styles/` → `src/shared/styles/`
- All imports updated to use new paths
- App structure remains unchanged (using Next.js App Router)