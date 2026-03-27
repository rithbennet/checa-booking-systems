# Notification Overview

This document is for humans. Agent-facing notification workflow rules now live
in repo skills.

## What matters

- CHECA uses both in-app notifications and email notifications.
- Workflow changes can affect notification behavior, even when the main feature
  change appears unrelated.
- Notification behavior is part of the product workflow and should be treated as
  a behavioral contract.

## Where to look

- For repo workflow: `skills/checa-repo-workflow/SKILL.md`
- For notification side-effect guidance: `skills/checa-notification-workflows/SKILL.md`

## When to update this document

Update this file only when the human-facing notification model changes, such as:

- adding or removing major notification channels
- changing whether workflow events notify users or admins
- changing the product expectations around notification delivery
