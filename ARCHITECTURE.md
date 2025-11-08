# Feature-Sliced Design Architecture

This project uses a Feature-Sliced Design (FSD) architecture with a custom twist.

## Folder Structure

```
src/
├── app/                    # Next.js app directory (routes, layouts, pages)
│   ├── widgets/           # Composite UI components (combine features + entities)
│   ├── (auth)/            # Auth routes
│   ├── (main)/            # Main app routes
│   └── api/               # API routes
├── features/              # Feature modules (self-contained functionality)
├── entities/              # Business entities (core domain models)
└── shared/                # Shared code (used across features/entities)
    ├── server/            # Server utilities, DB, auth
    └── styles/            # Global styles
```

## Architecture Layers

### 1. Shared (`src/shared/`)
**Purpose**: Code used across multiple features and entities.

- `server/` - Database connections, authentication, server utilities
- `styles/` - Global CSS and styling

**Rules**:
- Should not depend on features or entities
- Can be used by any layer

### 2. Entities (`src/entities/`)
**Purpose**: Core business concepts and domain models.

**Structure**:
```
entities/
  entity-name/
    ui/          # Entity-specific UI components
    model/       # Types, interfaces, schemas
    api/         # Entity-specific API calls
    lib/         # Entity-specific utilities
```

**Rules**:
- Can depend on shared
- Should not depend on features
- Represents core business concepts

### 3. Features (`src/features/`)
**Purpose**: Self-contained pieces of functionality.

**Structure**:
```
features/
  feature-name/
    ui/          # Feature UI components
    model/       # Feature types and state
    api/         # Feature API calls
    lib/         # Feature utilities
    config/      # Feature configuration
```

**Rules**:
- Can depend on shared and entities
- Should not depend on other features
- Self-contained functionality

### 4. Widgets (`src/app/widgets/`)
**Purpose**: Composite UI components that combine features and entities.

**Structure**:
```
widgets/
  widget-name/
    ui/          # Widget UI components
    index.ts     # Public API exports
```

**Rules**:
- Can depend on shared, entities, and features
- Can be composed together
- Used in app routes/pages

### 5. App (`src/app/`)
**Purpose**: Next.js app directory with routes and pages.

**Rules**:
- Uses widgets to compose pages
- Contains route handlers and layouts
- Pages are constructed using widgets

## Import Paths

- `@/shared/*` - Shared code
- `@/entities/*` - Entities
- `@/features/*` - Features
- `@/app/widgets/*` - Widgets

## Migration Notes

- Server code moved from `src/server/` → `src/shared/server/`
- Styles moved from `src/styles/` → `src/shared/styles/`
- All imports updated to use new paths
- App structure remains unchanged (using Next.js App Router)

## Example Usage

### Creating a Feature
```typescript
// src/features/booking/ui/BookingForm.tsx
import { User } from "@/entities/user/model/types";
import { db } from "@/shared/server/db";

export function BookingForm() {
  // Feature implementation
}
```

### Creating a Widget
```typescript
// src/app/widgets/dashboard/ui/Dashboard.tsx
import { BookingForm } from "@/features/booking/ui/BookingForm";
import { UserCard } from "@/entities/user/ui/UserCard";

export function Dashboard() {
  return (
    <div>
      <UserCard />
      <BookingForm />
    </div>
  );
}
```

### Using Widgets in Pages
```typescript
// src/app/(main)/dashboard/page.tsx
import { Dashboard } from "@/app/widgets/dashboard";

export default function DashboardPage() {
  return <Dashboard />;
}
```

