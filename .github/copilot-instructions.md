# Copilot Instructions for CHECA

This repo implements a lab booking and operations system using Next.js 15, Prisma, Better Auth, TanStack Query/Table, and Feature-Sliced Design (FSD). Follow these rules to stay aligned with existing patterns.

## 1. Architecture & Layer Rules
- Layer order: `shared → entities → features → widgets → app`.
- Import only "downwards" in this chain (e.g. `features` may import `entities` and `shared`, but not other `features`).
- Never import `app` code from lower layers.
- Use path aliases (no deep relative imports): `@/shared/*`, `@/entities/*`, `@/features/*`, `@/widgets/*`.

## 2. Where to Put Things
- **Server DB logic (Prisma)**: `src/entities/<entity>/server/*.ts`.
- **TanStack Query hooks + query keys**: `src/entities/<entity>/api/` (or sometimes `model/` for existing entities).
- **Entity types & Zod schemas**: `src/entities/<entity>/model/`.
- **Feature-specific UI/logic**: `src/features/<feature>/{ui,lib,model}`.
- **Composite page widgets**: `src/widgets/<widget>/`.
- **Pages & layouts**: `src/app/(auth|main)/**/page.tsx`, `layout.tsx`.
- **API routes**: `src/app/api/**/route.ts`.
- **Shared UI & utilities**: `src/shared/ui/**`, `src/shared/lib/**`, `src/shared/hooks/**`, `src/shared/server/**`.

## 3. Data Fetching & API Patterns
- Put all TanStack Query hooks in entities, not features or app pages.
- Use a query-key factory per entity, e.g. `bookingKeys`, `invoiceKeys` in `entities/<entity>/api/query-keys.ts`.
- For new API routes, follow the protected handler pattern:
  - Import `createProtectedHandler` from `@/shared/server/protected` or `api-factory` helpers.
  - Enforce roles there (e.g. `['lab_administrator']`), do not rely on middleware-only checks.
  - Call server repository functions from `entities/<entity>/server/*` and return mapped view models (VMs).
- Client components/pages should consume data via entity hooks (e.g. `useInvoiceDetail`, `useBookingCommandCenter`) rather than calling `fetch` directly.

## 4. Booking / Sample / Finance Domain Invariants
- Never bypass the **financial gate**: results download APIs and UI must check that the parent booking has at least one `Payment` with `status === 'verified'` before serving files.
- When creating bookings that include analysis services, automatically create corresponding `SampleTracking` rows in a single `prisma.$transaction`.
- Respect status enums from Prisma (e.g. `booking_status_enum`, `sample_status_enum`, `user_status_enum`) and use them consistently in UI badges, filters, and conditional logic.
- Admin-only operations (approving users, verifying payments, updating analysis status) must be protected by role checks in API/server handlers, not just in the UI.

## 5. Feature Implementation Workflow (Happy Path)
When adding a new admin/user feature that surfaces entity data, follow this sequence (see `AGENT_GUIDE.md` for full example):
1. **Entity layer**: add/extend types in `entities/<entity>/model/types.ts` and create a server repository in `entities/<entity>/server/*` that maps Prisma models to a VM tailored for the UI.
2. **API route**: create `app/api/.../route.ts` using `createProtectedHandler`, call the repository, handle 404 and auth.
3. **Entity API hooks**: add query keys and a `useXxx` hook in `entities/<entity>/api/*`, returning typed data.
4. **Feature**: create `features/<feature>/lib/helpers.ts` for formatting (dates, currency, status labels) and `features/<feature>/ui/*` components that consume the entity hook.
5. **Exports**: expose public surface from `entities/<entity>/index.ts` and `features/<feature>/index.ts`.
6. **Page/widget**: wire the feature into `src/app/(main)/**/page.tsx` or a `widgets/**` entry.

## 6. Styling, UI, and UX
- Use Tailwind + shadcn from `@/shared/ui/shadcn/*` for all new UI; follow patterns in `features/bookings/**` and `widgets/**` for layout, spacing, and typography.
- Prefer small, focused components (e.g. header, table, drawer) exported via a feature `index.ts` and composed in pages.
- For loading/error states, follow the common pattern from `AGENT_GUIDE.md`: `isLoading` → spinner section, `error || !data` → simple fallback, else render main component.

## 7. Auth, Middleware, and Security
- Use Better Auth helpers (exported from `@/auth` or `src/shared/server`) to identify the current user in server code; do not re-implement auth.
- Do not put business logic in `middleware.ts`; keep it to security headers/CSRF, and enforce permissions in route handlers and repositories.
- When adding new protected routes, ensure both:
  - Route-level role/ownership checks in the API/server action.
  - Matching UI visibility (hide buttons/actions the user cannot perform).

## 8. Tooling & Commands
- Before pushing, run at least:
  - `pnpm check` (Biome lint),
  - `pnpm typecheck` (TS), and
  - relevant flows in the browser (`pnpm dev`).
- For DB changes: update `prisma/schema.prisma`, then `pnpm db:push` and adjust entity server repositories/VM types accordingly.

## 9. Anti-Patterns to Avoid
- Don’t call Prisma directly from React components or features; always go through an entity server repository.
- Don’t create TanStack Query hooks inside `features` or `app` – keep them in `entities`.
- Don’t duplicate types across layers; define in `entities/<entity>/model` and import.
- Don’t cross-import between features; extract shared pieces into `entities` or `shared` instead.

For deeper examples and scaffolding templates, consult `AGENT_GUIDE.md`, `ARCHITECTURE.md`, `PRD.MD`, and the existing `features/bookings/**` + `entities/booking/**` implementation before introducing new patterns.
