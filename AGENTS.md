# CHECA Agent Instructions

This repo uses thin agent instructions and skill-first workflow guidance.

## Default behavior

- Treat this file as the canonical top-level instruction entrypoint.
- For any non-trivial work in this repo, use the CHECA repo skill:
  [`skills/checa-repo-workflow/SKILL.md`](skills/checa-repo-workflow/SKILL.md)
- Keep repo-level rules short here. Put reusable implementation guidance in skills.

## Minimal repo rules

- Preserve Feature-Sliced Design boundaries.
- Prefer existing patterns over introducing new abstractions.
- Do not move TanStack Query hooks out of entity-owned APIs without a strong reason.
- When changing validation, notifications, cache invalidation, or API auth flow,
  update the related docs if behavior changes.
- Before finishing substantive code changes, run the relevant verification commands.
- Default verification baseline: `pnpm check` and `pnpm typecheck`.
- Run `pnpm build` when changes may affect production build behavior, routing,
  bundling, or server/client rendering boundaries.
- If verification is skipped, state exactly what was not run and why.

## Primary skill

- `checa-repo-workflow`
  Path: [`skills/checa-repo-workflow/SKILL.md`](skills/checa-repo-workflow/SKILL.md)
  Use for feature work, refactors, reviews, API routes, Prisma-backed changes, and
  architecture-sensitive edits in this repo.

## Specialized skills

- `checa-fsd-architecture`
- `checa-api-validation`
- `checa-query-cache`
- `checa-notification-workflows`
- `checa-react-ui-conventions`

## External references

- Prefer the installed `vercel-react-best-practices` skill as the default
  general React baseline.
- Use `checa-react-ui-conventions` for repo-specific overrides and local
  conventions.
