# Features

This folder contains feature modules - self-contained pieces of functionality.

## Structure

Each feature should be organized as:

```
features/
  feature-name/
    ui/          # Feature-specific UI components
    model/       # Feature-specific types and state
    api/         # Feature-specific API calls
    lib/         # Feature-specific utilities
    config/      # Feature configuration
```

## Domain Organization

For complex domains with multiple related features, organize by domain with role-based subfolders:

```
features/
  bookings/
    admin/
      list/      # Admin booking list
      details/   # Admin booking details
    user/
      list/      # User booking list
      details/   # User booking details
    form/        # Booking creation/editing form
    shared/      # Shared booking components
  services/
    admin/
      management/  # Admin service management
        services/
        equipment/
        addons/
    selection/   # Service selection components
    ui/          # Service display components
  finance/
    admin/
      overview/
      forms/
      invoices/
      payments/
      results-on-hold/
    user/
      financials/
  users/
    admin/
      list/      # Admin user list
    profile/     # User profile components
```

## Example

```
features/
  authentication/
    ui/
      SignInForm.tsx
      SignUpForm.tsx
    model/
      types.ts
      schemas.ts
    lib/
      server-actions.ts
      utils.ts
```

## Usage

Features are self-contained and can use entities and shared code. They should not depend on other features directly.

## Role-Based Organization

When a feature has distinct admin and user variants, use `admin/` and `user/` subfolders:

- `bookings/admin/list/` - Admin booking list
- `bookings/user/list/` - User booking list
- `finance/admin/overview/` - Admin finance overview
- `finance/user/financials/` - User financials

This makes it clear which features are role-specific and improves discoverability.

