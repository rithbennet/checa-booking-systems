# Entities

This folder contains business entities - core domain models and their related logic.

## Structure

Each entity should be organized as:

```
entities/
  entity-name/
    ui/          # Entity-specific UI components
    model/       # Type definitions, interfaces, schemas
    api/         # Entity-specific API calls/queries
    lib/         # Entity-specific utilities
```

## Example

```
entities/
  user/
    ui/
      UserCard.tsx
      UserAvatar.tsx
    model/
      types.ts
      schema.ts
    api/
      getUser.ts
      updateUser.ts
    lib/
      formatUserName.ts
```

## Usage

Entities represent core business concepts and should be independent of specific features.

