# Booking Cache Overview

This document is for humans. Detailed query-key and invalidation rules are now
kept in repo skills for agents.

## What matters

- Booking screens rely on TanStack Query for list and detail consistency.
- Mutations are expected to keep affected booking views fresh.
- The repo prefers centralized invalidation behavior over scattered manual
  refetching in UI components.

## Where to look

- For repo workflow: `skills/checa-repo-workflow/SKILL.md`
- For query and cache agent guidance: `skills/checa-query-cache/SKILL.md`

## When to update this document

Update this file only when the human-facing cache strategy changes, such as:

- moving away from TanStack Query
- changing the high-level invalidation ownership model
- introducing a materially different data-refresh strategy
