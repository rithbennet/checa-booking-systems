/**
 * Centralized Status Utilities for Booking Lists
 * Used by both user and admin booking lists
 */

export const STATUS_LABELS: Record<string, string> = {
	draft: "Draft",
	pending_user_verification: "Pending",
	pending_approval: "Pending",
	revision_requested: "Rev. Requested",
	approved: "Approved",
	in_progress: "In progress",
	completed: "Completed",
	rejected: "Rejected",
	cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<
	string,
	{ bg: string; text: string; ring: string }
> = {
	draft: {
		bg: "bg-gray-100 dark:bg-gray-800",
		text: "text-gray-700 dark:text-gray-300",
		ring: "ring-gray-400",
	},
	pending_user_verification: {
		bg: "bg-yellow-50 dark:bg-yellow-900/20",
		text: "text-yellow-800 dark:text-yellow-200",
		ring: "ring-yellow-600",
	},
	pending_approval: {
		bg: "bg-yellow-50 dark:bg-yellow-900/20",
		text: "text-yellow-800 dark:text-yellow-200",
		ring: "ring-yellow-600",
	},
	revision_requested: {
		bg: "bg-amber-50 dark:bg-amber-900/20",
		text: "text-amber-700 dark:text-amber-200",
		ring: "ring-amber-600",
	},
	approved: {
		bg: "bg-emerald-50 dark:bg-emerald-900/20",
		text: "text-emerald-700 dark:text-emerald-200",
		ring: "ring-emerald-600",
	},
	in_progress: {
		bg: "bg-blue-50 dark:bg-blue-900/20",
		text: "text-blue-700 dark:text-blue-200",
		ring: "ring-blue-600",
	},
	completed: {
		bg: "bg-green-50 dark:bg-green-900/20",
		text: "text-green-700 dark:text-green-200",
		ring: "ring-green-600",
	},
	rejected: {
		bg: "bg-red-50 dark:bg-red-900/20",
		text: "text-red-700 dark:text-red-200",
		ring: "ring-red-600",
	},
	cancelled: {
		bg: "bg-orange-50 dark:bg-orange-900/20",
		text: "text-orange-700 dark:text-orange-200",
		ring: "ring-orange-600",
	},
};

export function getStatusLabel(status: string): string {
	return STATUS_LABELS[status] || status;
}

export function getStatusColors(status: string) {
	return (
		STATUS_COLORS[status] || {
			bg: "bg-gray-100",
			text: "text-gray-700",
			ring: "ring-gray-400",
		}
	);
}

/**
 * Get full className string for status badge with border (avoids Tailwind purging issues)
 */
export function getStatusBadgeClassName(status: string): string {
	const colors = STATUS_COLORS[status];
	if (!colors) {
		return "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700";
	}
	return `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`;
}
