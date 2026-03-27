# Validation Overview

This document is for humans. Agent-facing implementation rules now live in the
repo skills.

## What matters

- CHECA validates request shape at the API boundary.
- Domain and business-rule validation still happens in server-side code.
- Validation failures should surface as user-meaningful `400` responses, not
  generic server failures.

## Where to look

- For repo workflow: `skills/checa-repo-workflow/SKILL.md`
- For validation-specific agent guidance: `skills/checa-api-validation/SKILL.md`

## When to update this document

Update this file only when the human-level validation model changes, such as:

- validation moving to a different layer
- API error semantics changing
- the project no longer using Zod-based input validation
