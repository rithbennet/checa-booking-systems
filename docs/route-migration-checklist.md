# Route Migration Checklist (to API Factory)

Use this checklist to migrate API routes from middleware-centric auth to per-route auth using `createProtectedHandler`.

## Find candidates

- Grep for legacy patterns:

```sh
rg "requireCurrentUserApi|getSession|auth\(|getServerSession|req.cookies" src/app/api -n
```

## Convert handler(s)

- Replace method exports with wrappers from the API factory:

```ts
import { createProtectedHandler, requireAdmin } from "@/shared/lib/api-factory";

export const GET = createProtectedHandler(async ({ user, json }) => {
  // optional: active user only, etc.
  return json({ ok: true, whoami: user.id });
});

export const POST = createProtectedHandler(async ({ user, req, json }) => {
  // perform work; enforce role if needed
  return json({ ok: true });
});
```

- For admin routes:

```ts
export const POST = createProtectedHandler(async ({ user, json }) => {
  requireAdmin(user);
  // admin work
  return json({ ok: true });
});
```

## Params and validation

- If using dynamic params (e.g., `/api/resource/[id]`), access them as usual:

```ts
export const GET = createProtectedHandler(async ({ params, json }) => {
  const { id } = params;
  return json({ id });
});
```

The factory resolves async params internally to satisfy the Next.js App Router runtime.

- Validate bodies with Zod and return structured issues where helpful.

## Response helpers

- Prefer the factory’s helpers for consistent status/shape:
  - `json(data, status?)`
  - `badRequest(message | payload)`
  - `unauthorized(message)`
  - `forbidden(message)`
  - `notFound(message)`
  - `serverError(message)`

## Tests & verification

- Hit migrated routes in dev and confirm:
  - 401 when unauthenticated
  - 403 when role is insufficient
  - Happy-path returns expected JSON and status

## Cleanup

- Remove old auth glue and comments in the route
- Ensure middleware only contains security/CSRF logic
- Add notes to PR about migrated routes
