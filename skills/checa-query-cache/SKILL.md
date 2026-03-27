---
name: checa-query-cache
description: Use this skill whenever changing TanStack Query hooks, query keys, mutation hooks, prefetching, or cache invalidation in the CHECA repo. This should trigger for most list/detail/mutation work because the repo expects entity-owned query APIs and centralized invalidation rather than ad hoc refetch logic.
---

# CHECA Query And Cache

Use this skill for React Query and cache invalidation decisions.

## Core rules

- Keep query hooks in `entities/*/api`
- Keep query key factories next to the entity API
- Prefer mutation-owned invalidation over manual refetches scattered in UI
- Reuse existing keys and invalidation helpers before adding new ones

## Preferred behavior

- Invalidate the smallest affected set of views
- Preserve list/detail consistency after mutations
- Avoid duplicate fetch logic between widgets and features
- Use prefetching deliberately for pagination or high-frequency UI transitions

## Review priorities

1. UI manually refetching where mutation hooks should own invalidation
2. New keys that do not align with existing entity key structure
3. Missing invalidation after status-changing mutations
4. Overly broad invalidation causing avoidable churn
