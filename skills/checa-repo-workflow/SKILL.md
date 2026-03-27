---
name: checa-repo-workflow
description: Use this skill whenever working on the CHECA booking system codebase, especially for feature work, refactors, code review, API routes, TanStack Query hooks, Prisma-backed data changes, booking workflow changes, or documentation updates tied to behavior. This skill should trigger for most substantive work under src/, prisma/, README.md, or docs/ because the repo has specific Feature-Sliced Design placement, route validation, auth, and cache invalidation conventions that should not be re-derived from scratch.
---

# CHECA Repo Workflow

This skill is the canonical implementation guide for the CHECA booking system.
Keep top-level agent rules thin and keep the real workflow here.

## Outcomes

When using this skill, aim to:

1. Place code in the correct FSD layer on the first pass.
2. Reuse the repo's existing API, validation, and query patterns.
3. Update docs when behavior-level rules change.
4. Finish with code verification proportional to the change.

## Repo map

Primary references:

- `README.md`
- `skills/checa-fsd-architecture/SKILL.md`
- `skills/checa-react-ui-conventions/SKILL.md`
- `skills/checa-api-validation/SKILL.md`
- `skills/checa-query-cache/SKILL.md`
- `skills/checa-notification-workflows/SKILL.md`
- `docs/api-middleware-deprecation.md`
- `docs/route-migration-checklist.md`

## When this skill applies

Use it for:

- New features in `src/app`, `src/entities`, `src/features`, or `src/widgets`
- Refactors that move logic between layers
- API route work
- Prisma-backed server code
- React Query hooks, query keys, or mutation invalidation changes
- Booking, sample-tracking, finance, notification, or document workflow changes
- Code review of repo changes
- Updating architecture-sensitive docs

## Workflow

### 1. Start from the layer boundary

Respect the dependency direction and defer placement details to
`skills/checa-fsd-architecture/SKILL.md`.

### 2. Put data access where this repo expects it

- Prisma and server-side data loading belong in `entities/*/server`
- TanStack Query hooks belong in `entities/*/api`
- Query key factories should live with the entity API surface
- Feature components should consume entity hooks rather than embedding fetch logic

If an existing slice already has a pattern, follow that local pattern before
introducing a new one.

## API route conventions

- Prefer the current protected route pattern rather than restoring deprecated
  auth middleware behavior.
- For validation specifics, use `skills/checa-api-validation/SKILL.md`.
- Business rules should live in server services or repositories, not inline in
  the route when the logic is more than trivial.
- If a route migration touches auth behavior, consult:
  - `docs/api-middleware-deprecation.md`
  - `docs/route-migration-checklist.md`

## Validation conventions

Use `skills/checa-api-validation/SKILL.md`.

## Query and cache conventions

Use `skills/checa-query-cache/SKILL.md`.

## Notifications and workflow side effects

Use `skills/checa-notification-workflows/SKILL.md`.

## React and UI conventions

Use `skills/checa-react-ui-conventions/SKILL.md`.

## Code review mode

When reviewing changes in this repo, prioritize:

1. Layer violations across `shared`, `entities`, `features`, `widgets`, `app`
2. Broken query invalidation after mutations
3. Missing route-boundary validation
4. Notification or workflow regressions
5. Missing doc updates for behavior changes

## Completion checklist

Before finishing, do the ones that apply:

- `pnpm check` for substantive code changes
- `pnpm typecheck` for substantive code changes
- `pnpm build` when the change may affect production build behavior, routing,
  bundling, SSR, or client/server boundaries
- targeted tests if present
- manual smoke check for changed workflows

If you skip verification, say exactly what was not run.
