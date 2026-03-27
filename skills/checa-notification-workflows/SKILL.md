---
name: checa-notification-workflows
description: Use this skill whenever changing user or admin workflow transitions that may send notifications, emails, or upload-triggered events in the CHECA repo. This should trigger for booking, payment, form, sample, or account-status changes because those flows often carry side effects beyond the primary database mutation.
---

# CHECA Notification Workflows

Use this skill when a workflow change may affect notifications.

## Core rules

- Check both in-app and email side effects
- Treat workflow transitions as behavior changes, not just data changes
- Avoid silently removing an existing notification path
- Keep notification logic in the established notification modules

## Areas commonly affected

- User approval and rejection
- Booking submission, approval, rejection, and revision requests
- Invoice and payment verification
- Service form generation and signed form upload
- Sample status updates and result availability

## Review priorities

1. State transitions that used to notify but no longer do
2. New transitions without matching admin or user notifications where expected
3. Template or payload mismatches
4. Upload workflows that mutate state but skip downstream side effects
