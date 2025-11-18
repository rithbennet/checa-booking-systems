/**
 * Admin Booking List Utilities
 */

import {
  ADMIN_ACTION_PERMISSIONS,
  ADMIN_STATUS_LABELS,
  BULK_DELETE_ALLOWED_STATUSES,
} from "./admin-list.constants";
import type { AdminBookingStatus } from "./admin-list.types";
import {
  getStatusBadgeClassName,
  getStatusColors,
  getStatusLabel,
} from "@/shared/lib/status-utils";

export function getAdminStatusLabel(status: string): string {
  return ADMIN_STATUS_LABELS[status] ?? getStatusLabel(status);
}

export function getAdminStatusColors(status: string) {
  return getStatusColors(status);
}

/**
 * Get full className string for status badge (uses centralized utils)
 */
export function getAdminStatusBadgeClassName(status: string): string {
  return getStatusBadgeClassName(status);
}

/**
 * Check if a specific action is allowed for a booking status
 */
export function canPerformAction(
  status: string,
  action: "approve" | "requestRevision" | "reject" | "delete"
): boolean {
  const permissions = ADMIN_ACTION_PERMISSIONS[status as AdminBookingStatus];
  if (!permissions) return false;

  switch (action) {
    case "approve":
      return permissions.approve;
    case "requestRevision":
      return permissions.requestRevision;
    case "reject":
      return permissions.reject;
    case "delete":
      return permissions.delete;
    default:
      return false;
  }
}

/**
 * Check if a booking can be bulk deleted based on its status
 */
export function canBulkDelete(status: string): boolean {
  return BULK_DELETE_ALLOWED_STATUSES.includes(
    status as (typeof BULK_DELETE_ALLOWED_STATUSES)[number]
  );
}

/**
 * Get actionable statuses for default filter
 */
export function getDefaultActionableStatuses(): AdminBookingStatus[] {
  return ["pending_approval", "revision_submitted"];
}

/**
 * Format sort key to API parameters
 */
export function formatSortForAPI(sortKey: string): {
  field: string;
  direction: "asc" | "desc";
} {
  switch (sortKey) {
    case "updated_newest":
      return { field: "updatedAt", direction: "desc" };
    case "updated_oldest":
      return { field: "updatedAt", direction: "asc" };
    case "created_newest":
      return { field: "createdAt", direction: "desc" };
    case "created_oldest":
      return { field: "createdAt", direction: "asc" };
    case "amount_high":
      return { field: "totalAmount", direction: "desc" };
    case "amount_low":
      return { field: "totalAmount", direction: "asc" };
    default:
      return { field: "updatedAt", direction: "desc" };
  }
}
