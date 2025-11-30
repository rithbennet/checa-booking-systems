/**
 * User Booking Detail Helpers
 *
 * Formatting utilities and helper functions for the user booking details view.
 */

/**
 * Format a date string to a short display format (e.g., "Nov 17")
 */
export function formatShortDate(dateStr: string | null | undefined): string {
	if (!dateStr) return "";
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Format a date string to full date format (e.g., "Nov 17, 2025")
 */
export function formatDate(dateStr: string | null | undefined): string {
	if (!dateStr) return "";
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

/**
 * Format a date string to date and time format (e.g., "Nov 17, 2025, 10:30 AM")
 */
export function formatDateTime(dateStr: string | null | undefined): string {
	if (!dateStr) return "";
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

/**
 * Format a date to relative time (e.g., "2 days ago", "Today")
 */
export function formatRelativeTime(dateStr: string | null | undefined): string {
	if (!dateStr) return "";

	const date = new Date(dateStr);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffMinutes = Math.floor(diffMs / (1000 * 60));

	if (diffMinutes < 1) return "Just now";
	if (diffMinutes < 60) return `${diffMinutes}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "Yesterday";
	if (diffDays < 7) return `${diffDays} days ago`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

	return formatShortDate(dateStr);
}

/**
 * Format currency amount in MYR
 */
export function formatCurrency(amount: string | number): string {
	const num = typeof amount === "string" ? Number.parseFloat(amount) : amount;
	return new Intl.NumberFormat("en-MY", {
		style: "currency",
		currency: "MYR",
	}).format(num);
}

/**
 * Calculate the number of days between two dates
 */
export function getDurationDays(startDate: string, endDate: string): number {
	const start = new Date(startDate);
	const end = new Date(endDate);
	const diffTime = Math.abs(end.getTime() - start.getTime());
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Calculate days remaining until a target date
 */
export function getDaysRemaining(
	targetDate: string | null | undefined,
): number | null {
	if (!targetDate) return null;
	const target = new Date(targetDate);
	const now = new Date();
	const diffMs = target.getTime() - now.getTime();
	return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get status label for booking status
 */
export function getStatusLabel(status: string): string {
	const labels: Record<string, string> = {
		draft: "Draft",
		pending_user_verification: "Pending Verification",
		pending_approval: "Pending Approval",
		revision_requested: "Revision Requested",
		approved: "Approved",
		rejected: "Rejected",
		in_progress: "In Progress",
		completed: "Completed",
		cancelled: "Cancelled",
	};
	return labels[status] ?? status;
}

/**
 * Get status color classes for booking status
 */
export function getStatusColor(status: string): string {
	const colors: Record<string, string> = {
		draft: "bg-gray-100 text-gray-800 border-gray-200",
		pending_user_verification:
			"bg-yellow-100 text-yellow-800 border-yellow-200",
		pending_approval: "bg-blue-100 text-blue-800 border-blue-200",
		revision_requested: "bg-amber-100 text-amber-800 border-amber-200",
		approved: "bg-green-100 text-green-800 border-green-200",
		rejected: "bg-red-100 text-red-800 border-red-200",
		in_progress: "bg-purple-100 text-purple-800 border-purple-200",
		completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
		cancelled: "bg-gray-100 text-gray-600 border-gray-200",
	};
	return colors[status] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

/**
 * Get sample status label
 */
export function getSampleStatusLabel(status: string): string {
	const labels: Record<string, string> = {
		pending: "Pending",
		received: "Received",
		in_analysis: "In Analysis",
		analysis_complete: "Complete",
		return_requested: "Return Requested",
		returned: "Returned",
	};
	return labels[status] ?? status;
}

/**
 * Get sample status color classes
 */
export function getSampleStatusColor(status: string): string {
	const colors: Record<string, string> = {
		pending: "bg-slate-100 text-slate-600 border-slate-200",
		received: "bg-blue-100 text-blue-700 border-blue-200",
		in_analysis: "bg-yellow-100 text-yellow-800 border-yellow-200",
		analysis_complete: "bg-green-100 text-green-700 border-green-200",
		return_requested: "bg-purple-100 text-purple-700 border-purple-200",
		returned: "bg-gray-100 text-gray-600 border-gray-200",
	};
	return colors[status] ?? "bg-slate-100 text-slate-600 border-slate-200";
}
