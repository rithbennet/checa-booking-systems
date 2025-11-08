# Shared

This folder contains shared code that is used across multiple features and entities.

## Structure

- `server/` - Server-side utilities, database connections, authentication, etc.
- `styles/` - Global styles and CSS files

## Usage

Import shared code using the `@/shared/*` path alias:

```typescript
import { db } from "@/shared/server/db";
import "@/shared/styles/globals.css";
```

