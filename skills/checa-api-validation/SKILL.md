---
name: checa-api-validation
description: Use this skill whenever changing API routes, request parsing, Zod schemas, server-side validation, or validation error handling in the CHECA repo. This should trigger for most route and mutation work because the repo expects route-boundary input validation, domain-level business validation, and consistent 400 responses for validation failures.
---

# CHECA API Validation

Use this skill for route validation and validation error handling.

## Core rules

- Validate request shape at the route boundary
- Keep business-rule validation in server or domain code
- Use Zod schemas as the source of truth for input validation
- Return validation failures as `400`, not `500`

## Placement

- Entity schemas: `src/entities/<entity>/model/schema.ts` or `schemas.ts`
- Feature schemas: `src/features/<feature>/model/schema.ts`
- Route handlers: `src/app/api/**/route.ts`
- Domain services or repositories: `src/entities/**/server/*.ts`

## Route pattern

At the route:

1. Parse request body or params
2. Validate with Zod
3. Return clear `400` responses for shape errors
4. Pass validated data to server code

In server code:

1. Enforce business invariants
2. Throw explicit validation/domain errors when needed
3. Avoid hiding validation failures inside generic exceptions

## Review priorities

1. Missing route-boundary validation
2. Generic errors where validation-specific errors should exist
3. Schemas duplicated across routes and server modules
4. Business validation mixed with transport parsing
