---
name: checa-fsd-architecture
description: Use this skill whenever working on code placement, Feature-Sliced Design boundaries, route composition, or deciding whether logic belongs in shared, entities, features, widgets, or app in the CHECA repo. This should trigger for most refactors, new features, or code review comments about structure because the repo has a specific FSD layout that should not be improvised.
---

# CHECA FSD Architecture

Use this skill to decide where code belongs and to review layer boundaries.

## Layer order

- `shared`: cross-cutting utilities, UI primitives, config, hooks, server helpers
- `entities`: domain models, repositories, query hooks, simple entity UI
- `features`: user-facing workflows and feature-specific UI
- `widgets`: page-level compositions of features and entities
- `app`: routes, pages, layouts, API handlers

Dependency direction:

- `app` can depend on all lower layers
- `widgets` can depend on `features`, `entities`, `shared`
- `features` can depend on `entities`, `shared`
- `entities` can depend on `shared`
- `shared` should not depend on higher layers

## Placement rules

- Put Prisma-backed server code in `entities/*/server`
- Put TanStack Query hooks and query keys in `entities/*/api`
- Put feature-only schemas, helpers, and UI in `features/*`
- Put simple reusable status badges or entity displays in `entities/*/ui`
- Put route handlers in `src/app/api/*`
- Put page composition in `src/app/*/page.tsx`

## Review priorities

Flag these first:

1. Feature logic leaking into `shared`
2. Query hooks created in features instead of entities
3. Pages doing data orchestration that belongs in entities or features
4. Duplicate abstractions introduced beside an established slice pattern

## Decision heuristic

Ask in this order:

1. Is this domain-specific?
2. Is it reused by multiple workflows or only one?
3. Is it fetching or mutating server state?
4. Is it page composition rather than business functionality?

Default to following the nearest established local pattern if one already exists.
