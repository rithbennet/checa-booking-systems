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

## Example

```
features/
  authentication/
    ui/
      SignInForm.tsx
      SignUpForm.tsx
    model/
      types.ts
      store.ts
    api/
      signIn.ts
      signUp.ts
    lib/
      validateEmail.ts
    config/
      constants.ts
```

## Usage

Features are self-contained and can use entities and shared code. They should not depend on other features directly.

