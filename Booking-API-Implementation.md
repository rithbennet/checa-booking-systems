
Plan: Booking API Integration (Single-resource, Draft → Submit, Admin Review, Cron Cleanup)



Task 1: Define DTOs and mapping helpers
- Intent: Use a consistent DTO to validate/transform RHF payloads, map to normalized DB rows, and compute totals.
- Files:
  - src/entities/booking/model/schemas.ts
  - src/entities/booking/server/booking.dto.ts (new)
  - src/entities/booking/server/booking.mapper.ts (new)
- Steps:
  - In schemas.ts, ensure Zod schemas for CreateBookingInput/BookingServiceItemInput/WorkspaceBookingInput exist and are exported for server-side validation.
  - booking.dto.ts:
    - Export bookingSaveDraftDto: schema that accepts partial payload for draft saving (more permissive), and bookingSubmitDto: strict payload for submit (full validation).
  - booking.mapper.ts:
    - mapDtoToNormalized(input, services/pricing): returns normalized structures for BookingServiceItem, WorkspaceBooking, ServiceAddOns with computed prices.
    - computeTotals(normalized): returns totalAmount.
- Acceptance:
  - DTO and mapping compile. Unit tests optional.

Task 2: Feature-scoped service and repo layer
- Intent: Encapsulate business logic and DB calls.
- Files:
  - src/entities/booking/server/booking.service.ts (new)
  - src/entities/booking/server/booking.repo.ts (new)
  - src/entities/booking/server/booking.notifications.ts (new, no-op)
- Steps:
  - booking.repo.ts:
    - findBookingById(bookingId)
    - ensureOwner(bookingId, userId)
    - createDraft({ userId, referenceNumber, now })
    - updateDraft({ bookingId, step, projectDescription?, preferred dates?, notes? })
    - upsertServiceItems({ bookingId, items }) with delete of removed ids
    - upsertWorkspaceBookings({ bookingId, items }) with delete of removed ids
    - upsertAddOns({ bookingId, perItemAddOns, perWorkspaceAddOns })
    - updateTotals({ bookingId, totalAmount })
    - setStatus({ bookingId, status, reviewNotes?, reviewedBy?, reviewedAt? })
    - deleteDraft({ bookingId, userId }) // only when status = draft
    - deleteExpiredDrafts(cutoff)
    - listAdmins(): ids/emails for notifications (basic)
    - newReferenceNumber(): e.g., "BK-" + ULID or timestamp base
  - booking.service.ts:
    - createDraft(userId) → { bookingId, referenceNumber }
      - generate referenceNumber
      - create BookingRequest with status=draft, totalAmount=0
    - getBooking({ userId, bookingId })
      - ensure ownership; return booking and children
    - saveDraft({ userId, bookingId, step, dto })
      - ensure ownership; ensure status=draft
      - validate dto with bookingSaveDraftDto.safeParse (do not block on minor errors)
      - map dto → normalized rows; compute totals
      - call repo upserts for children and update totals and step
      - return lastSaved snapshot (including server IDs)
    - submit({ userId, bookingId, userStatus })
      - ensure ownership; ensure status=draft
      - load full booking and children; map to DTO; strict-validate with bookingSubmitDto
      - newStatus = (userStatus === "active") ? pending_approval : pending_user_verification
      - setStatus(newStatus), clear reviewNotes
      - enqueue notifications: booking_submitted to user; to admins:
        - if pending_user_verification → booking_pending_verification
        - else “new booking pending approval” (use booking_submitted for admins or extend enum later)
      - return { bookingId, status: newStatus }
    - adminReturnForEdit({ adminId, bookingId, note })
      - ensure admin; ensure status in { pending_approval } (optionally approved if you allow revert)
      - set status=draft, reviewNotes=note, reviewedBy/At=now
      - notify user with note
    - adminReject({ adminId, bookingId, note })
      - ensure admin; ensure current status = pending_approval
      - require note, set status=rejected, reviewNotes=note, reviewedBy/At
      - notify user booking_rejected
    - adminApprove({ adminId, bookingId })
      - ensure admin; ensure current status = pending_approval
      - set status=approved, reviewedBy/At; notify user booking_approved
    - onUserVerified({ adminId, userId })
      - set user.status=active (outside or here)
      - flip all user bookings in pending_user_verification → pending_approval
      - notify affected users/admins
    - purgeExpiredDrafts(cutoff: Date)
      - deleteExpiredDrafts(cutoff) and return count
  - booking.notifications.ts:
    - enqueueInApp(userId, type, relatedEntityType, relatedEntityId, title, message)
    - enqueueEmail(to, template, variables) // no-op now
- Acceptance:
  - Services compile; repo calls Prisma and respects onDelete cascades.

Task 3: API Routes (App Router)
- Intent: Thin handlers calling service methods, with auth and guards.
- Files:
  - src/app/api/bookings/route.ts
  - src/app/api/bookings/[id]/route.ts
  - src/app/api/bookings/[id]/submit/route.ts
  - src/app/api/bookings/[id]/return-for-edit/route.ts (admin)
  - src/app/api/bookings/[id]/approve/route.ts (admin)
  - src/app/api/bookings/[id]/reject/route.ts (admin)
  - src/app/api/admin/users/[userId]/verify/route.ts (admin)
  - src/app/api/admin/jobs/cleanup-drafts/route.ts (cron)
- Steps:
  - All routes use auth session from src/shared/server/auth/session (existing).
  - Users:
    - POST /api/bookings → createDraft
    - GET /api/bookings/[id] → getBooking (owner)
    - PATCH /api/bookings/[id] → saveDraft (owner; status=draft)
    - DELETE /api/bookings/[id] → deleteDraft (owner; status=draft)
    - POST /api/bookings/[id]/submit → submit (owner; status=draft). No verification block; route sets status based on user.status.
  - Admin:
    - POST /api/bookings/[id]/return-for-edit { note } → adminReturnForEdit (disallow from rejected)
    - POST /api/bookings/[id]/approve → adminApprove
    - POST /api/bookings/[id]/reject { note } → adminReject (note required)
    - POST /api/admin/users/[userId]/verify → onUserVerified (and set user status=active if not elsewhere)
  - Cron:
    - POST /api/admin/jobs/cleanup-drafts → purgeExpiredDrafts(cutoff = now - 7days); check x-admin-job-key
- Acceptance:
  - Routes compile; basic e2e works with Postman/Thunder tests.

Task 4: Pricing and totals computation
- Intent: Ensure consistent totalAmount at every save/submit.
- Files:
  - src/entities/booking/server/booking.repo.ts (add ServicePricing queries)
  - src/entities/booking/server/booking.mapper.ts (computeTotals)
- Steps:
  - For each service item, fetch role-based price (ServicePricing where serviceId and userType and effective date). Fallback rules defined by product owner.
  - Calculate item total:
    - For working_space: unit is monthly or per configured unit, total = durationMonths * unitPrice (+ add-ons)
    - For analysis: total = quantity * unitPrice (+ add-ons)
  - Sum over service items and workspace bookings add-ons; store total in BookingRequest.totalAmount
- Acceptance:
  - Unit test computeTotals for working_space vs analysis items.

Task 5: Guards and status enforcement
- Intent: Apply “editable only in draft” and “rejected is immutable” rules.
- Files:
  - src/entities/booking/server/booking.service.ts
- Steps:
  - saveDraft throws 403 if current status != draft
  - submit throws 400/409 if not draft (or expired if you keep that guard)
  - adminReturnForEdit throws 400 if current status = rejected
  - adminApprove/adminReject enforce current status = pending_approval
- Acceptance:
  - Negative tests (optional) show proper errors.

Task 6: Notifications (in-app now, email later)
- Intent: Record notifications using Notification model and keep adapter pluggable.
- Files:
  - src/entities/booking/server/booking.notifications.ts
  - src/entities/booking/server/booking.service.ts (call adapter)
- Steps:
  - Implement enqueueInApp to prisma.notification.create
  - On submit:
    - Always notify user booking_submitted
    - If status = pending_user_verification → notify admins booking_pending_verification
    - If status = pending_approval → notify admins booking_submitted (or add a new type later)
  - On approve → booking_approved to user
  - On reject → booking_rejected to user with reviewNotes
  - On return-for-edit → custom notification to user with notes (use booking_submitted with a message or extend enum later)
- Acceptance:
  - Notifications rows created as expected.

Task 7: Vercel Cron for draft cleanup
- Intent: Hard delete drafts older than 7 days.
- Files:
  - vercel.json
  - src/app/api/admin/jobs/cleanup-drafts/route.ts
- Steps:
  - vercel.json:
    - Add cron: path /api/admin/jobs/cleanup-drafts, schedule "0 3 * * *"
  - route.ts:
    - Check x-admin-job-key matches process.env.JOB_KEY
    - cutoff = now - 7 days
    - call service.purgeExpiredDrafts(cutoff)
    - return { purged, cutoff }
- Acceptance:
  - Deployed cron runs; logs show purged count.

Task 8: Client integration adjustments
- Intent: Wire the new API endpoints to the refactored frontend.
- Files:
  - src/entities/booking/hooks/use-booking-form.ts (or wherever you call fetch)
  - src/widgets/booking-page/*
- Steps:
  - Start booking: POST /api/bookings → store bookingId + referenceNumber in wizard store
  - Next/Save: PATCH /api/bookings/:id with { step, data: form.getValues() } → update wizard lastSavedAt and reconcile server IDs if returned
  - Submit: POST /api/bookings/:id/submit → show banner based on status:
    - pending_user_verification: “Your account requires verification; admins will review.”
    - pending_approval: “Your booking is pending approval.”
  - Discard: DELETE /api/bookings/:id → reset wizard/store and navigate away
  - If admin returned for edit:
    - Booking GET will show status=draft with reviewNotes visible; surface notes to user UI
- Acceptance:
  - Happy path works e2e in local/dev.

Task 9: Admin endpoints usage
- Intent: Provide admin UI actions (approve/reject/return for edit/verify user).
- Files:
  - src/features/admin-bookings/* (or widgets)
  - API calls to:
    - POST /api/bookings/:id/approve
    - POST /api/bookings/:id/reject
    - POST /api/bookings/:id/return-for-edit
    - POST /api/admin/users/:userId/verify
- Steps:
  - Ensure reject requires note.
  - Return for edit requires note, sets status=draft, and not allowed from rejected.
- Acceptance:
  - Admin actions move statuses correctly.

Task 10: Security and policies
- Intent: Enforce ownership and RBAC.
- Files:
  - src/shared/server/auth/policies.ts (new)
  - Route handlers
- Steps:
  - Owner enforcement: userId === booking.userId for user routes
  - Admin enforcement: role check (user_type_enum.lab_administrator or dedicated role flag)
  - Rate limiting (optional) on PATCH draft saves
- Acceptance:
  - Unauthorized/forbidden requests blocked.

Task 11: Optional tests
- Intent: Cover core transitions and invariants.
- Files:
  - tests/api/booking/*.test.ts
- Scenarios:
  - Create draft → save draft → submit (active) → pending_approval
  - Create draft → submit (pending user) → pending_user_verification → admin verifies user → auto flip to pending_approval
  - Admin return-for-edit from pending_approval → draft; user resubmits → pending_approval
  - Admin reject from pending_approval → rejected; user cannot edit or submit anymore
  - Cleanup cron deletes stale drafts

Key code snippets

- vercel.json
```json
{
  "crons": [
    {
      "path": "/api/admin/jobs/cleanup-drafts",
      "schedule": "0 3 * * *"
    }
  ]
}
```

- API: submit logic (owner, draft-only, status set by user.status)
```ts
// src/app/api/bookings/[id]/submit/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/shared/server/auth/session";
import { submit } from "@/entities/booking/server/booking.service";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userStatus = session.user.status; // "active" | "pending" | etc.
  try {
    const result = await submit({
      userId: session.user.id,
      bookingId: params.id,
      userStatus,
    });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Bad request" }, { status: 400 });
  }
}
```

- Service: submit transition
```ts
// src/entities/booking/server/booking.service.ts
export async function submit(params: {
  userId: string;
  bookingId: string;
  userStatus: "active" | "pending" | "inactive" | "rejected" | "suspended";
}) {
  const { userId, bookingId, userStatus } = params;

  await repo.ensureOwner(bookingId, userId);
  const booking = await repo.findBookingById(bookingId);
  if (!booking || booking.status !== "draft") throw new Error("Not editable");

  // Load normalized children, map to DTO, validate with Zod (strict)
  // const dto = buildDtoFromDb(booking, children);
  // bookingSubmitDto.parse(dto);

  const newStatus =
    userStatus === "active" ? "pending_approval" : "pending_user_verification";

  await repo.setStatus({
    bookingId,
    status: newStatus,
    reviewNotes: null,
    reviewedBy: null,
    reviewedAt: null,
  });

  await notifyOnSubmit({ userId, bookingId, status: newStatus });

  return { bookingId, status: newStatus };
}
```

- Cron route
```ts
// src/app/api/admin/jobs/cleanup-drafts/route.ts
import { NextResponse } from "next/server";
import { purgeExpiredDrafts } from "@/entities/booking/server/booking.service";

export async function POST(req: Request) {
  const key = req.headers.get("x-admin-job-key");
  if (process.env.JOB_KEY && key !== process.env.JOB_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const purged = await purgeExpiredDrafts(cutoff);
  return NextResponse.json({ purged, cutoff: cutoff.toISOString() });
}
```

- Admin: reject (immutable thereafter)
```ts
// src/app/api/bookings/[id]/reject/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/shared/server/auth/policies";
import { adminReject } from "@/entities/booking/server/booking.service";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { adminId } = await requireAdmin();
  const { note } = await req.json();
  if (!note || !note.trim()) {
    return NextResponse.json({ error: "Rejection note is required" }, { status: 400 });
  }
  try {
    await adminReject({ adminId, bookingId: params.id, note });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Bad request" }, { status: 400 });
  }
}
```

Acceptance criteria
- Users can create, save, and submit bookings regardless of verification state.
- Submit transitions:
  - active → pending_approval
  - else → pending_user_verification
- Admin can return for edit (pending_approval → draft) with notes; user can edit and resubmit.
- Admin can reject (pending_approval → rejected with notes). Rejected bookings are immutable to users and cannot be returned for edit.
- Admin can approve (pending_approval → approved).
- Daily cron deletes stale drafts > 7 days; cascading deletes clean children.
- Notifications are recorded for key events; email/queue integration is future-ready.

Open hooks for future
- Implement email templates and queue in booking.notifications.ts without changing API/service signatures.
- Add “in_progress”, “completed”, and financial/results flows later using the same service/repo pattern.