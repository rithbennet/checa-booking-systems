# Widgets

This folder contains widgets - composite UI components that combine multiple features and entities.

## Structure

Widgets are organized by their purpose:

```
widgets/
  widget-name/
    ui/          # Widget UI components
    index.ts     # Public API exports
```

## Example

```
widgets/
  header/
    ui/
      Header.tsx
      Navigation.tsx
    index.ts
  dashboard/
    ui/
      Dashboard.tsx
      StatsCard.tsx
    index.ts
```

## Usage

Widgets are used in the app folder to compose pages. They can:
- Combine multiple features
- Use entities
- Use shared code
- Be composed together

Import widgets in your app routes:

```typescript
import { Header } from "@/app/widgets/header";
import { Dashboard } from "@/app/widgets/dashboard";
```

