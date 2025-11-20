import type { booking_status_enum } from "generated/prisma";

export const adminCanApprove = (s: booking_status_enum) =>
	s === "pending_approval";

export const adminCanReject = (s: booking_status_enum) => adminCanApprove(s);

export const adminCanRequestRevision = (s: booking_status_enum) =>
	s === "pending_approval";

export const adminCanDelete = (s: booking_status_enum) =>
	s === "draft" ||
	s === "rejected" ||
	s === "cancelled" ||
	s === "revision_requested";
