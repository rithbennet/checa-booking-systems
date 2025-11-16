# API Middleware Deprecation (Auth & RBAC)

We have deprecated using the global middleware for authentication, ownership checks, and RBAC. These responsibilities now live in per-route handlers using the API factory (Option C) with Better Auth.

## What changed

- Middleware (`src/middleware.ts`) is now "security-only":
  - Adds security headers
  - Enforces a basic CSRF check for state-changing `/api/*` requests
- All auth/role/ownership checks must occur in the route handlers via `createProtectedHandler`.
- A runtime toggle, `DEPRECATE_API_MIDDLEWARE`, helps surface deprecation during migration.

## Why

- Per-route checks provide better clarity, testability, and least-privilege control.
- Avoids global coupling and surprises from centralized role gates.

## What you should do (Migration)

1. Identify routes to migrate
   - Look for any API route that uses legacy helpers or hand-rolled session logic:

     ```sh
     rg "requireCurrentUserApi|getSession|auth\(|getServerSession|req.cookies" src/app/api -n
     ```

2. Wrap handlers with the API factory
   - Use `createProtectedHandler` from `src/shared/lib/api-factory.ts`.
   - Enforce roles with `requireAdmin` or custom checks inside the handler.

   Example:

   ```ts
   import { createProtectedHandler, requireAdmin } from "@/shared/lib/api-factory";

   export const POST = createProtectedHandler(async ({ req, user, json }) => {
     requireAdmin(user);
     // ... your admin logic
     return json({ ok: true });
   });
   ```

3. Remove legacy auth logic
   - Delete in-route session lookups or middleware-only gates.
   - Keep only the per-route checks via the factory.

4. Verify dynamic params
   - If your route reads `ctx.params`, the factory already awaits possible Promises to avoid Next.js warnings.

5. Validate end-to-end
   - Run `pnpm typecheck` and hit endpoints in dev.
   - Confirm 401/403 behavior is correct per route.

## Runtime deprecation toggle

- Set `DEPRECATE_API_MIDDLEWARE=true` (or `1`) during migration to:
  - Add `X-Deprecated-Auth-Middleware: on` to responses
  - Log a one-time console warning at cold start

Disable it later by unsetting the var or setting `false`.

## Removal timeline

- Week 0: Marked as deprecated, docs published, runtime toggle available
- Week 1–2: Migrate routes in batches, QA
- Week 3–4: Remove any leftover legacy auth logic from routes
- Week 4+: Optionally remove the toggle and any deprecation scaffolding

## References

- API factory: `src/shared/lib/api-factory.ts`
- Auth utilities: `src/shared/server/auth.ts`
- Security-only middleware: `src/middleware.ts`
