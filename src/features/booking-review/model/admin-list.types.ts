/**
 * Admin Booking List Types
 * Defines types specific to the admin booking review list feature
 */

import type { BookingListItemVM } from "@/entities/booking/model/types";

export type AdminSortKey =
  | "updated_newest"
  | "updated_oldest"
  | "created_newest"
  | "created_oldest"
  | "amount_high"
  | "amount_low";

export type AdminBookingStatus =
  | "pending_approval"
  | "revision_submitted"
  | "revision_requested"
  | "approved"
  | "in_progress"
  | "completed"
  | "rejected"
  | "cancelled";

export type AdminBookingTypeFilter =
  | "all"
  | "analysis_only"
  | "workspace_only"
  | "internal"
  | "external";

export type AdminBookingRowVM = BookingListItemVM & {
  updatedAt: string;
  requesterType: "internal" | "external";
  projectTitle?: string;
  hasWorkspace: boolean;
};

export type AdminBookingListFilters = {
  page: number;
  pageSize: 25 | 50 | 100;
  sort: AdminSortKey;
  query?: string;
  status?: AdminBookingStatus[];
  type?: AdminBookingTypeFilter;
};

export type AdminStatusCounts = {
  all: number;
  pending_approval: number;
  revision_submitted: number;
  revision_requested: number;
  approved: number;
  in_progress: number;
  completed: number;
  rejected: number;
  cancelled: number;
};

export type AdminBookingAction = "approve" | "reject" | "request_revision";

export type BulkActionResult = {
  success: string[];
  failed: Array<{ id: string; reason: string }>;
  message: string;
};
