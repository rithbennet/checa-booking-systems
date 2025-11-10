/**
 * Booking entity utilities
 */

import type { BookingRequest, BookingStatus } from "../model/types";

/**
 * Format booking status for display
 */
export function formatBookingStatus(status: BookingStatus): string {
	const statusMap: Record<BookingStatus, string> = {
		pending_user_verification: "Pending Verification",
		pending_approval: "Pending Approval",
		approved: "Approved",
		rejected: "Rejected",
		in_progress: "In Progress",
		completed: "Completed",
		cancelled: "Cancelled",
	};

	return statusMap[status] || status;
}

/**
 * Get booking status color
 */
export function getBookingStatusColor(
	status: BookingStatus,
): "default" | "secondary" | "destructive" | "outline" {
	const colorMap: Record<BookingStatus, "default" | "secondary" | "destructive" | "outline"> = {
		pending_user_verification: "secondary",
		pending_approval: "secondary",
		approved: "default",
		rejected: "destructive",
		in_progress: "default",
		completed: "default",
		cancelled: "destructive",
	};

	return colorMap[status] || "outline";
}

/**
 * Check if booking can be modified
 */
export function canModifyBooking(status: BookingStatus): boolean {
	return ["approved", "in_progress"].includes(status);
}

/**
 * Check if booking is active
 */
export function isBookingActive(status: BookingStatus): boolean {
	return !["rejected", "cancelled", "completed"].includes(status);
}

/**
 * Generate booking reference number
 */
export function generateBookingReference(): string {
	const prefix = "BR";
	const timestamp = Date.now().toString(36).toUpperCase();
	const random = Math.random().toString(36).substring(2, 6).toUpperCase();
	return `${prefix}-${timestamp}-${random}`;
}

