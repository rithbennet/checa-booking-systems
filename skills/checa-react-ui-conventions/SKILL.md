---
name: checa-react-ui-conventions
description: Use this skill whenever creating or refactoring React components, props, local state, or UI composition in the CHECA repo. This should trigger for most component work because the repo favors small focused components, derived state, contextual prop naming, and straightforward TypeScript prop design.
---

# CHECA React UI Conventions

Use this skill for React component decisions in this repo.

## Relationship to external skills

If the `vercel-react-best-practices` skill is available, use it as the general
React baseline and treat this skill as the CHECA-specific overlay.

This skill should win when repo conventions are more specific than generic
React guidance.

## Core rules

- Prefer small focused function components
- Use contextual prop names
- Avoid boolean soup in component APIs
- Derive values inline instead of storing derived state
- Use `type` for props

## Favor

- One main component per file
- Composition over oversized configuration props
- Clear state names like `isOpen`, `query`, `activeId`
- Splitting large files before they become hard to review

## Review priorities

1. Derived state stored in hooks unnecessarily
2. Props that duplicate component context
3. Components that are doing too many jobs
4. Boolean-heavy APIs that should be a variant or separate component
