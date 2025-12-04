# Notification System Documentation

This document describes the ChECA Lab notification system, including email templates, triggers, configuration, and testing.

## Overview

The notification system handles both:
1. **In-app notifications** - Stored in the `Notification` table and displayed in the user's notification center
2. **Email notifications** - Sent via Resend with React Email templates

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Notification Flow                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  API Route/Service Layer                                     │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────┐                                       │
│  │ Notification     │  e.g., notifyUserAccountApproved()    │
│  │ Service Layer    │  - Creates in-app notification        │
│  │ (*.notifications)│  - Calls email sender                 │
│  └──────────────────┘                                       │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────┐                                       │
│  │ Email Sender     │  safeSendEmail() with retry logic     │
│  │ (email-sender.ts)│  - Handles retries                    │
│  └──────────────────┘  - Structured logging                 │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────┐                                       │
│  │ Email Templates  │  React Email components               │
│  │ (email-templates)│                                       │
│  └──────────────────┘                                       │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────┐                                       │
│  │ Resend API       │  Email delivery service               │
│  └──────────────────┘                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Event Matrix

| Event | Trigger Point | Template | Notification Function | Module |
|-------|---------------|----------|----------------------|--------|
| User Approved | `/api/admin/users/[id]/approve` | `AccountVerifiedEmail` | `notifyUserAccountApproved` | `user.notifications.ts` |
| User Rejected | `/api/admin/users/[id]/reject` | `AccountRejectedEmail` | `notifyUserAccountRejected` | `user.notifications.ts` |
| User Suspended/Deactivated | `/api/admin/users/[id]/status` | `AccountSuspendedEmail` | `notifyUserAccountStatusChanged` | `user.notifications.ts` |
| New User Registered | Email verification complete | `AdminNewUserRegisteredEmail` | `notifyAdminsNewUserRegistered` | `user.notifications.ts` |
| Booking Submitted | Booking creation | `BookingSubmittedEmail` | Via booking service | `booking.notifications.ts` |
| Booking Approved | Admin approval | `BookingApprovedEmail` | Via booking service | `booking.notifications.ts` |
| Booking Rejected | Admin rejection | `BookingRejectedEmail` | Via booking service | `booking.notifications.ts` |
| Revision Requested | Admin returns for edits | `BookingRevisionRequestedEmail` | Via booking service | `booking.notifications.ts` |
| Invoice Uploaded | Admin uploads invoice | `InvoiceUploadedEmail` | `notifyInvoiceUploaded` | `finance.notifications.ts` |
| Payment Verified | Admin verifies payment | `PaymentVerifiedEmail` | `notifyPaymentVerified` | `finance.notifications.ts` |
| Payment Proof Uploaded | User uploads receipt | `AdminNotificationEmail` | `notifyAdminsPaymentUploaded` | `finance.notifications.ts` |
| Sample Status Changed | `/api/admin/samples/[id]/status` | `SampleStatusUpdateEmail` | `notifySampleStatusChanged` | `sample.notifications.ts` |
| Results Available | After payment verification | `ResultsAvailableEmail` | `notifyResultsAvailable` | `sample.notifications.ts` |
| Service Form Ready | Form generation complete | `ServiceFormReadyEmail` | `notifyServiceFormReady` | `form.notifications.ts` |
| Signed Forms Uploaded | User uploads signed forms | `AdminNotificationEmail` | `notifyAdminsSignedFormsUploaded` | `form.notifications.ts` |

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend API key for email delivery | `re_xxx...` |
| `EMAIL_FROM` | Default sender email address | `noreply@checa.lab` |
| `BETTER_AUTH_URL` | Base URL for dashboard links | `https://checa.lab` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `EMAIL_REPLY_TO` | Reply-to address | None |
| `EMAIL_ENABLED` | Enable/disable all emails | `true` |
| `EMAIL_REDIRECT_TO` | Redirect all emails to test inbox | None |

### Staging Configuration

For staging/testing environments, set:

```bash
# Redirect all emails to a test inbox
EMAIL_REDIRECT_TO=test-inbox@yourcompany.com
```

When `EMAIL_REDIRECT_TO` is set, all emails will be sent to this address instead of the intended recipient. The original recipient is logged for debugging.

### Disabling Emails

```bash
# Disable all email sending (in-app notifications still work)
EMAIL_ENABLED=false
```

## Adding a New Template

### 1. Create the Template Component

Create a new file in `src/entities/notification/server/email-templates/`:

```tsx
// MyNewEmail.tsx
import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

interface MyNewEmailProps {
  customerName: string;
  // ... other props
}

export function MyNewEmail({ customerName }: MyNewEmailProps) {
  return (
    <BaseLayout preview="Preview text">
      <Heading>Title</Heading>
      <Text>Dear {customerName},</Text>
      {/* ... content */}
    </BaseLayout>
  );
}

export default MyNewEmail;
```

### 2. Export from Index

Add to `email-templates/index.ts`:

```ts
export { MyNewEmail } from "./MyNewEmail";
```

### 3. Create Sender Function

Add to `email-sender.ts`:

```ts
export async function sendMyNewEmail(params: {
  to: string;
  customerName: string;
  userId?: string;
}) {
  return safeSendEmail({
    to: params.to,
    subject: "Subject Line",
    react: MyNewEmail({
      customerName: params.customerName,
    }),
    context: {
      template: "MyNewEmail",
      entityType: "entity",
      userId: params.userId,
    },
  });
}
```

### 4. Create Notification Service Function

Add to appropriate `*.notifications.ts` file:

```ts
export async function notifyMyNewEvent(params: {
  userId: string;
  // ... other params
}) {
  const userDetails = await getUserEmailDetails(params.userId);
  if (!userDetails) return;

  // Create in-app notification
  await enqueueInApp({
    userId: params.userId,
    type: "appropriate_type",
    relatedEntityType: "entity",
    relatedEntityId: "id",
    title: "Title",
    message: "Message",
  });

  // Send email
  await sendMyNewEmail({
    to: userDetails.email,
    customerName: userDetails.name,
    userId: params.userId,
  });
}
```

### 5. Add to Health Check

Add the template to `api/admin/notifications/health/route.ts`:

```ts
{
  name: "MyNewEmail",
  render: () => MyNewEmail({
    customerName: "Test User",
  }),
},
```

## Retry Policy

The email sender implements exponential backoff retry:

- **Max retries**: 3
- **Initial delay**: 1 second
- **Backoff**: 2^(attempt-1) seconds

Retry sequence: 1s → 2s → 4s

## Idempotency

### Current Implementation

- In-app notifications are created with unique IDs
- The `emailSent` and `emailSentAt` fields on `Notification` track email delivery status
- The `markEmailSent()` helper updates these fields after successful email send

### Future Considerations

For high-volume scenarios, consider adding a `NotificationOutbox` table:

```prisma
model NotificationOutbox {
  id          String   @id @default(uuid())
  eventType   String
  entityId    String
  entityHash  String?  // For version-based deduplication
  sentAt      DateTime?
  createdAt   DateTime @default(now())
  
  @@unique([eventType, entityId])
}
```

## Logging

Email operations use structured JSON logging:

```json
{
  "timestamp": "2025-01-01T12:00:00.000Z",
  "event": "email-sent",
  "template": "AccountVerifiedEmail",
  "entityType": "user",
  "userId": "uuid",
  "subject": "Your ChECA Lab Account Has Been Verified",
  "originalRecipient": "user@example.com",
  "messageId": "resend-message-id"
}
```

Log events:
- `email-sent` - Successful delivery
- `email-skipped` - Email disabled or API key missing
- `email-redirected` - Redirected to test inbox (staging)
- `email-api-error` - Resend API returned error
- `email-exception` - Exception during send
- `email-failed` - All retries exhausted

## Health Check

Access the health check endpoint:

```
GET /api/admin/notifications/health
```

Response:

```json
{
  "status": "healthy",
  "emailEnabled": true,
  "timestamp": "2025-01-01T12:00:00.000Z",
  "summary": {
    "total": 17,
    "passed": 17,
    "failed": 0
  },
  "templates": [
    { "name": "AccountVerifiedEmail", "success": true },
    // ... other templates
  ]
}
```

## Local Testing

### CLI Script

```bash
# Send a test notification (coming soon)
pnpm ts-node scripts/dev/send-notification.ts \
  --type AccountVerified \
  --userId <user-id>
```

### Email Preview

Use the health check endpoint to verify templates render without errors, then check your Resend dashboard for email previews.

## Troubleshooting

### Emails not sending

1. Check `RESEND_API_KEY` is set
2. Check `EMAIL_ENABLED` is not `false`
3. Check logs for `[Email]` entries
4. Verify the domain is verified in Resend

### Emails going to wrong address

1. Check `EMAIL_REDIRECT_TO` is not set (or set correctly for staging)
2. Verify the user has a valid email address

### Template render errors

1. Access `/api/admin/notifications/health` to see which templates fail
2. Check the error message for missing props or component issues

### Duplicate emails

1. Check if the notification trigger is being called multiple times
2. Verify the service layer is called after DB commit, not during transaction
3. Consider adding idempotency checks if the issue persists
