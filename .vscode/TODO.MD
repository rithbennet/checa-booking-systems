Ensure you scan the current architecture of the project for consistency.

1) Schema and lifecycle updates

- Add explicit revision states to booking_status_enum for clarity across all listings:
  - revision_requested: admin sends booking back to user for more data.
  - revision_submitted: user resubmits after editing; ready for re-review.

- Updated enum
```diff
enum booking_status_enum {
  draft
  pending_user_verification
  pending_approval
+ revision_requested
+ revision_submitted
  approved
  rejected
  in_progress
  completed
  cancelled
}
```

- Allowed transitions for this feature:
  - pending_approval → approved | rejected | revision_requested
  - revision_requested → revision_submitted (user action)
  - revision_submitted → approved | rejected | revision_requested
  - Bulk delete allowed only for draft | rejected | cancelled | revision_requested

- Prisma migration note for Postgres enum:
  - Prisma will generate ALTER TYPE statements. If applying manually:
```sql
ALTER TYPE "booking_status_enum"
  ADD VALUE IF NOT EXISTS 'revision_requested';
ALTER TYPE "booking_status_enum"
  ADD VALUE IF NOT EXISTS 'revision_submitted';
```

2) FSD and Entities layout ( Next.js app router assumed )

Create these folders/files. Names are stable and agent-friendly.

- Entities (source of truth for data contracts, queries, mutations)
  - src/entities/booking/
    - index.ts
    - model/
      - types.ts                       // shared Booking types (view models)
      - status.ts                      // guards, allowed transitions
      - mappers.ts                     // DB → VM mapping
    - api/
      - query-keys.ts                  // TanStack stable keys
      - useAdminBookingList.ts         // list query hook
      - useAdminBookingDetail.ts       // detail query hook
    - review/
      - api/
        - useApproveBooking.ts
        - useRejectBooking.ts
        - useRequestRevision.ts
        - useBulkAction.ts
      - server/                        // you asked for this domain
        - actions.ts                   // server actions (Prisma + tx)
        - validations.ts               // zod schemas for payloads
        - repository.ts                // prisma queries for review module
- Features (UI that composes entities) You can reuse components from the booking list, if they are universal moved them to the shared/ui folder.
  - src/features/booking-review/
    - ui/
      - AdminBookingList.tsx
      - AdminBookingToolbar.tsx
      - AdminBookingTable.tsx
      - AdminBookingQuickViewDialog.tsx
      - AdminBookingDetailPage.tsx
      - ActionButtons.tsx
    - lib/
      - columns.ts                     // table column defs (reused/adapted)
      - formatters.ts
- Notifications factory (pluggable)
  - src/entities/notification/
    - model/
      - events.ts                      // domain events types
    - server/
      - factory.ts                     // one place to wire email/push later
      - templates.ts                   // title/message mappers
- Routes (app)
  - app/admin/bookings/page.tsx        // uses AdminBookingList
  - app/admin/bookings/[id]/page.tsx   // uses AdminBookingDetailPage
  - app/api/admin/bookings/[id]/action/route.ts
  - app/api/admin/bookings/bulk-action/route.ts
- Shared UI (reusable)
  - src/shared/ui/StatusBadge.tsx
  - src/shared/ui/ConfirmDialog.tsx
  - src/shared/ui/QuickViewDialog.tsx

3) Entities: contracts, query keys, and guards

- types.ts (view models used by UI)
```ts
import { booking_status_enum, Service } from "@prisma/client";

export type BookingListItemVM = {
  id: string;
  referenceNumber: string;
  createdAt: string;
  status: booking_status_enum;
  user: { id: string; name: string; email: string };
  organization?: { company?: string; branch?: string };
  totalAmount: string;
  services: Array<{ id: string; name: string; qty: number }>;
};

export type BookingDetailVM = BookingListItemVM & {
  projectDescription?: string;
  serviceItems: Array<{
    id: string;
    service: Pick<Service, "id" | "name" | "category">;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    sampleName?: string;
  }>;
  workspace?: {
    startDate?: string;
    endDate?: string;
    notes?: string;
  };
  reviewNotes?: string | null;
};
```

- status.ts (allowed transitions and admin guards)
```ts
import { booking_status_enum } from "@prisma/client";

export const adminCanApprove = (s: booking_status_enum) =>
  s === "pending_approval" || s === "revision_submitted";

export const adminCanReject = (s: booking_status_enum) => adminCanApprove(s);

export const adminCanRequestRevision = (s: booking_status_enum) =>
  s === "pending_approval" || s === "revision_submitted";

export const adminCanDelete = (s: booking_status_enum) =>
  s === "draft" || s === "rejected" || s === "cancelled" || s === "revision_requested";
```

- query-keys.ts
```ts
export const bookingKeys = {
  all: ["bookings"] as const,
  adminList: (params: Record<string, unknown>) =>
    [...bookingKeys.all, "admin", "list", params] as const,
  adminDetail: (id: string) =>
    [...bookingKeys.all, "admin", "detail", id] as const,
};
```

4) Entities: server repository + actions (Prisma + transactions)

- repository.ts
```ts
import { prisma } from "@/lib/prisma";

export async function repoAdminList(params: {
  status?: string[];
  query?: string;
  page?: number;
  pageSize?: number;
}) {
  const { status, query, page = 1, pageSize = 25 } = params;

  const where: any = {
    ...(status?.length ? { status: { in: status } } : {}),
    ...(query
      ? {
          OR: [
            { referenceNumber: { contains: query, mode: "insensitive" } },
            { user: { firstName: { contains: query, mode: "insensitive" } } },
            { user: { lastName: { contains: query, mode: "insensitive" } } },
            { companyRelation: { name: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.bookingRequest.findMany({
      where,
      include: {
        user: true,
        companyRelation: true,
        companyBranch: true,
        serviceItems: { include: { service: true } },
        workspaceBookings: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.bookingRequest.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function repoAdminDetail(id: string) {
  return prisma.bookingRequest.findUniqueOrThrow({
    where: { id },
    include: {
      user: true,
      companyRelation: true,
      companyBranch: true,
      serviceItems: {
        include: {
          service: true,
          serviceAddOns: true,
          equipmentUsages: { include: { equipment: true } },
          sampleTracking: true, // used later
        },
      },
      workspaceBookings: {
        include: {
          equipmentUsages: { include: { equipment: true } },
          serviceAddOns: true,
        },
      },
    },
  });
}
```

- validations.ts (zod)
```ts
import { z } from "zod";

export const AdminActionSchema = z.object({
  action: z.enum(["approve", "reject", "request_revision"]),
  comment: z.string().max(2000).optional(),
});

export const BulkActionSchema = z.object({
  action: z.enum(["approve", "reject", "request_revision", "delete"]),
  ids: z.array(z.string().uuid()).min(1),
  comment: z.string().max(2000).optional(),
});
```

- actions.ts (single source of truth for transitions)
```ts
import { prisma } from "@/lib/prisma";
import { booking_status_enum, Prisma } from "@prisma/client";
import { sendBookingEvent } from "@/entities/notification/server/factory";

type AdminAction = "approve" | "reject" | "request_revision";

function nextStatus(action: AdminAction): booking_status_enum {
  if (action === "approve") return "approved";
  if (action === "reject") return "rejected";
  return "revision_requested";
}

export async function doAdminAction(params: {
  bookingId: string;
  adminUserId: string;
  action: AdminAction;
  comment?: string;
}) {
  const { bookingId, adminUserId, action, comment } = params;

  return prisma.$transaction(async (tx) => {
    const b = await tx.bookingRequest.findUniqueOrThrow({
      where: { id: bookingId },
      select: { id: true, status: true, userId: true },
    });

    const isActionable =
      b.status === "pending_approval" || b.status === "revision_submitted";

    if (!isActionable) {
      throw new Error("Booking is not in a reviewable state");
    }

    const updated = await tx.bookingRequest.update({
      where: { id: bookingId },
      data: {
        status: nextStatus(action),
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
        reviewNotes: comment,
      },
    });

    await sendBookingEvent(tx, {
      bookingId: b.id,
      userId: b.userId,
      event:
        action === "approve"
          ? "BOOKING_APPROVED"
          : action === "reject"
          ? "BOOKING_REJECTED"
          : "BOOKING_REVISION_REQUESTED",
      comment,
      oldStatus: b.status,
      newStatus: updated.status,
    });

    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: `booking.${action}`,
        entity: "booking",
        entityId: b.id,
        metadata: { oldStatus: b.status, newStatus: updated.status, comment },
      },
    });

    return updated;
  });
}

export async function doBulkAdminAction(params: {
  ids: string[];
  adminUserId: string;
  action: AdminAction | "delete";
  comment?: string;
}) {
  const { ids, adminUserId, action, comment } = params;

  if (action === "delete") {
    // Only safe deletions
    await prisma.bookingRequest.deleteMany({
      where: {
        id: { in: ids },
        status: { in: ["draft", "rejected", "cancelled", "revision_requested"] },
      },
    });
    return { ok: true };
  }

  // Loop to keep notifications/audit per item
  const results = [];
  for (const id of ids) {
    try {
      const r = await doAdminAction({
        bookingId: id,
        adminUserId,
        action: action as AdminAction,
        comment,
      });
      results.push({ id, ok: true });
    } catch (e: any) {
      results.push({ id, ok: false, error: e.message });
    }
  }
  return { results };
}
```

5) Entities: client hooks with TanStack Query

- useAdminBookingList.ts
```ts
import { useQuery } from "@tanstack/react-query";
import { bookingKeys } from "./query-keys";

export function useAdminBookingList(params: {
  status?: string[];
  query?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: bookingKeys.adminList(params),
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/bookings?` +
          new URLSearchParams({
            ...(params.query ? { query: params.query } : {}),
            ...(params.status?.length ? { status: params.status.join(",") } : {}),
            page: String(params.page ?? 1),
            pageSize: String(params.pageSize ?? 25),
          }),
      );
      if (!res.ok) throw new Error("Failed to load bookings");
      return res.json();
    },
    staleTime: 10_000,
    keepPreviousData: true,
  });
}
```

- useAdminBookingDetail.ts
```ts
import { useQuery } from "@tanstack/react-query";
import { bookingKeys } from "./query-keys";

export function useAdminBookingDetail(id: string) {
  return useQuery({
    queryKey: bookingKeys.adminDetail(id),
    queryFn: async () => {
      const res = await fetch(`/api/admin/bookings/${id}`);
      if (!res.ok) throw new Error("Failed to load booking");
      return res.json();
    },
  });
}
```

- mutations (approve/reject/request revision)
```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingKeys } from "../../api/query-keys";

function useAction(action: "approve" | "reject" | "request_revision") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; comment?: string }) => {
      const res = await fetch(`/api/admin/bookings/${args.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment: args.comment }),
      });
      if (!res.ok) throw new Error("Action failed");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: bookingKeys.all });
      qc.invalidateQueries({ queryKey: bookingKeys.adminDetail(variables.id) });
    },
  });
}

export const useApproveBooking = () => useAction("approve");
export const useRejectBooking = () => useAction("reject");
export const useRequestRevision = () => useAction("request_revision");
```

6) API routes (app router)

- GET list: app/api/admin/bookings/route.ts → uses repoAdminList
- GET detail: app/api/admin/bookings/[id]/route.ts → uses repoAdminDetail
- POST action: app/api/admin/bookings/[id]/action/route.ts → uses doAdminAction
- POST bulk: app/api/admin/bookings/bulk-action/route.ts → uses doBulkAdminAction

All routes must call requireAdmin guard.

7) Notifications factory (pluggable push/email)

- events.ts
```ts
export type BookingEvent =
  | "BOOKING_APPROVED"
  | "BOOKING_REJECTED"
  | "BOOKING_REVISION_REQUESTED";
```

- templates.ts
```ts
import { notification_type_enum } from "@prisma/client";
import { BookingEvent } from "./events";

export function mapBookingEventToTemplate(e: {
  event: BookingEvent;
  comment?: string;
}) {
  switch (e.event) {
    case "BOOKING_APPROVED":
      return {
        title: "Booking approved",
        message: "Your booking has been approved.",
        type: notification_type_enum.booking_approved,
      };
    case "BOOKING_REJECTED":
      return {
        title: "Booking rejected",
        message: e.comment ?? "Your booking was rejected.",
        type: notification_type_enum.booking_rejected,
      };
    case "BOOKING_REVISION_REQUESTED":
      return {
        title: "More information required",
        message:
          e.comment ??
          "Please revise your booking and resubmit for approval.",
        type: notification_type_enum.booking_pending_verification,
      };
  }
}
```

- factory.ts
```ts
import { PrismaClient } from "@prisma/client";
import { mapBookingEventToTemplate } from "./templates";
import { BookingEvent } from "./events";

type Tx = Omit<PrismaClient, "$on" | "$connect" | "$disconnect">;

export async function sendBookingEvent(
  tx: Tx,
  args: {
    bookingId: string;
    userId: string;
    event: BookingEvent;
    comment?: string;
    oldStatus: string;
    newStatus: string;
  },
) {
  const tpl = mapBookingEventToTemplate({
    event: args.event,
    comment: args.comment,
  });

  await tx.notification.create({
    data: {
      userId: args.userId,
      type: tpl.type,
      relatedEntityType: "booking",
      relatedEntityId: args.bookingId,
      title: tpl.title,
      message: tpl.message,
      emailSent: false,
    },
  });

  // Future: plug email/push providers here only.
}
```

8) UI behavior summary

- AdminBookingList
  - Filters: status multi-select includes revision_requested and revision_submitted.
  - Search: reference, user, company.
  - Bulk actions: approve, reject, request revision, delete (safe only).
  - Row actions: Quick View (dialog), Open full page.

- AdminBookingQuickViewDialog
  - Shows booking summary, services, workspace summary.
  - Inline actions with optional comment field (for reject/request revision).
  - “Open full page” button.

- AdminBookingDetailPage
  - Header: ref, user/org, StatusBadge, action buttons.
  - Tabs:
    - Overview: all booking/service details (reuse user components).
    - Samples: disabled tab placeholder; future integration.
  - After action success, surface toast and update status.

9) Permissions and invariants

- requireAdmin guard for all admin endpoints and pages.
- Action guards:
  - approve/reject/request revision: only pending_approval or revision_submitted.
  - delete: only draft, rejected, cancelled, revision_requested.
- On success, always:
  - write AuditLog
  - emit notification via factory
  - invalidate TanStack queries bookingKeys.all

10) Test plan (minimal to start)

- Unit: nextStatus() mapping returns correct enum.
- Integration (server):
  - doAdminAction transitions with tx; prevents invalid transitions.
  - doBulkAdminAction deletes only allowed statuses.
  - Notification row created with expected type/title.
- E2E (smoke):
  - Admin list loads with filters.
  - Quick view approve updates status and list reflects without full reload.

11) Rollout checklist

- Apply enum migration (revision_requested, revision_submitted).
- Update all existing listing/status badge components to recognize new statuses.
- Seed/test bookings covering each actionable state.
- Deploy routes and confirm admin auth guard works.
- Verify notifications table entries on actions.

12) Out of scope for this sprint (stubs in UI)

- Sample tracking updates (tab exists, disabled).
- PDF generation and uploads, invoices, payments.
- Email/push providers (factory ready; no provider wired).

