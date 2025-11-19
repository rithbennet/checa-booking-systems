/**
 * Admin Booking List Constants
 */

import type { AdminSortKey } from "./admin-list.types";

export const ADMIN_DEFAULT_PAGE_SIZE = 25;

export const ADMIN_DEFAULT_SORT: AdminSortKey = "updated_newest";

export const ADMIN_DEFAULT_STATUS_FILTER = ["pending_approval"] as const;

export const ADMIN_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export const ADMIN_SORT_OPTIONS: Array<{
	value: AdminSortKey;
	label: string;
}> = [
	{ value: "updated_newest", label: "Updated (newest)" },
	{ value: "updated_oldest", label: "Updated (oldest)" },
	{ value: "created_newest", label: "Created (newest)" },
	{ value: "created_oldest", label: "Created (oldest)" },
	{ value: "amount_high", label: "Amount (high → low)" },
	{ value: "amount_low", label: "Amount (low → high)" },
];

export const ADMIN_STATUS_LABELS: Record<string, string> = {
	pending_approval: "Pending",
	revision_requested: "Rev. Requested",
	approved: "Approved",
	in_progress: "In Progress",
	completed: "Completed",
	rejected: "Rejected",
	cancelled: "Cancelled",
};

export const ADMIN_STATUS_COLORS: Record<
	string,
	{ bg: string; text: string; ring: string }
> = {
	pending_approval: {
		bg: "bg-blue-50 dark:bg-blue-900/20",
		text: "text-blue-700 dark:text-blue-200",
		ring: "ring-blue-600",
	},
	revision_requested: {
		bg: "bg-amber-50 dark:bg-amber-900/20",
		text: "text-amber-700 dark:text-amber-200",
		ring: "ring-amber-600",
	},
	approved: {
		bg: "bg-green-50 dark:bg-green-900/20",
		text: "text-green-700 dark:text-green-200",
		ring: "ring-green-600",
	},
	in_progress: {
		bg: "bg-purple-50 dark:bg-purple-900/20",
		text: "text-purple-700 dark:text-purple-200",
		ring: "ring-purple-600",
	},
	completed: {
		bg: "bg-gray-50 dark:bg-gray-900/20",
		text: "text-gray-700 dark:text-gray-200",
		ring: "ring-gray-600",
	},
	rejected: {
		bg: "bg-red-50 dark:bg-red-900/20",
		text: "text-red-700 dark:text-red-200",
		ring: "ring-red-600",
	},
	cancelled: {
		bg: "bg-slate-50 dark:bg-slate-900/20",
		text: "text-slate-700 dark:text-slate-200",
		ring: "ring-slate-600",
	},
};

/**
 * Status-based action permissions matrix
 */
export const ADMIN_ACTION_PERMISSIONS = {
	pending_approval: {
		approve: true,
		requestRevision: true,
		reject: true,
		delete: false,
	},
	revision_requested: {
		approve: false,
		requestRevision: false,
		reject: false,
		delete: true,
	},
	approved: {
		approve: false,
		requestRevision: false,
		reject: false,
		delete: false,
	},
	in_progress: {
		approve: false,
		requestRevision: false,
		reject: false,
		delete: false,
	},
	completed: {
		approve: false,
		requestRevision: false,
		reject: false,
		delete: false,
	},
	rejected: {
		approve: false,
		requestRevision: false,
		reject: false,
		delete: true,
	},
	cancelled: {
		approve: false,
		requestRevision: false,
		reject: false,
		delete: true,
	},
} as const;

/**
 * Bulk action permissions - which statuses allow bulk delete
 */
export const BULK_DELETE_ALLOWED_STATUSES = [
	"revision_requested",
	"rejected",
	"cancelled",
] as const;
