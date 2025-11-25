/**
 * Booking Command Center Helpers
 *
 * Formatting utilities and helper functions for the booking details view.
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
 * Get initials from a name
 */
export function getInitials(firstName: string, lastName: string): string {
	return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
