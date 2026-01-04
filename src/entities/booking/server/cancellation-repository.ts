/**
 * Booking Cancellation Server Repository
 *
 * Handles cancellation logic for both user and admin-initiated cancellations.
 * Includes audit logging and email notifications.
 */

import {
	sendBookingCancelledByAdminEmail,
	sendBookingCancelledByUserEmail,
	sendBookingCancelledNotificationToAdmins,
} from "@/entities/notification/server/email-sender";
import { db } from "@/shared/server/db";

interface CancelBookingByUserParams {
	bookingId: string;
	userId: string;
	reason?: string;
}

interface CancelBookingByAdminParams {
	bookingId: string;
	adminUserId: string;
	reason?: string;
}

interface CancelBookingResult {
	success: boolean;
	data?: {
		id: string;
		status: string;
		reviewedAt: string | null;
		reviewNotes: string | null;
	};
	error?: string;
}

interface UpdateBookingTimelineParams {
	bookingId: string;
	preferredStartDate: string | null;
	preferredEndDate: string | null;
	userId: string;
	userRole: string;
}

interface UpdateBookingTimelineResult {
	success: boolean;
	data?: {
		id: string;
		preferredStartDate: string | null;
		preferredEndDate: string | null;
	};
	error?: string;
}

/**
 * Cancel a booking initiated by the user
 * - Validates ownership
 * - Prevents cancelling completed bookings
 * - Creates audit log
 * - Sends notifications to user and admins
 */
export async function cancelBookingByUser(
	params: CancelBookingByUserParams,
): Promise<CancelBookingResult> {
	const { bookingId, userId, reason } = params;

	// Check if booking exists and belongs to the user
	const booking = await db.bookingRequest.findUnique({
		where: { id: bookingId },
		select: {
			id: true,
			status: true,
			userId: true,
			referenceNumber: true,
			user: {
				select: {
					firstName: true,
					lastName: true,
					email: true,
				},
			},
		},
	});

	if (!booking) {
		return { success: false, error: "Booking not found" };
	}

	// Verify ownership
	if (booking.userId !== userId) {
		return {
			success: false,
			error: "You can only cancel your own bookings",
		};
	}

	// Prevent re-cancelling
	if (booking.status === "cancelled") {
		return { success: false, error: "Booking is already cancelled" };
	}

	// Prevent cancelling completed bookings
	if (booking.status === "completed") {
		return { success: false, error: "Cannot cancel a completed booking" };
	}

	// Update booking to cancelled and create audit log in a transaction
	const [updated] = await db.$transaction([
		db.bookingRequest.update({
			where: { id: bookingId },
			data: {
				status: "cancelled",
				reviewedAt: new Date(),
				reviewedBy: userId,
				reviewNotes: reason
					? `User cancellation: ${reason}`
					: "Booking cancelled by user",
			},
			select: {
				id: true,
				status: true,
				reviewedAt: true,
				reviewNotes: true,
			},
		}),
		db.auditLog.create({
			data: {
				userId,
				action: "booking_cancelled_by_user",
				entity: "booking",
				entityId: bookingId,
				metadata: {
					referenceNumber: booking.referenceNumber,
					reason: reason || null,
					previousStatus: booking.status,
				},
			},
		}),
	]);

	// Send email notifications (async, non-blocking)
	const userName = `${booking.user.firstName} ${booking.user.lastName}`;

	// Send confirmation to user
	sendBookingCancelledByUserEmail({
		to: booking.user.email,
		userName,
		referenceNumber: booking.referenceNumber,
		reason,
		bookingId,
		userId,
	}).catch((error) => {
		console.error(
			"[cancelBookingByUser] Failed to send user confirmation email:",
			error,
		);
	});

	// Notify admins
	sendBookingCancelledNotificationToAdmins({
		referenceNumber: booking.referenceNumber,
		userName,
		userEmail: booking.user.email,
		reason,
		bookingId,
	}).catch((error) => {
		console.error(
			"[cancelBookingByUser] Failed to send admin notification:",
			error,
		);
	});

	return {
		success: true,
		data: {
			id: updated.id,
			status: updated.status,
			reviewedAt: updated.reviewedAt?.toISOString() ?? null,
			reviewNotes: updated.reviewNotes,
		},
	};
}

/**
 * Cancel a booking initiated by an admin
 * - Validates booking exists
 * - Prevents re-cancellation
 * - Creates audit log
 * - Sends notification to user
 */
export async function cancelBookingByAdmin(
	params: CancelBookingByAdminParams,
): Promise<CancelBookingResult> {
	const { bookingId, adminUserId, reason } = params;

	// Check if booking exists
	const booking = await db.bookingRequest.findUnique({
		where: { id: bookingId },
		select: {
			id: true,
			status: true,
			referenceNumber: true,
			userId: true,
			user: {
				select: {
					firstName: true,
					lastName: true,
					email: true,
				},
			},
		},
	});

	if (!booking) {
		return { success: false, error: "Booking not found" };
	}

	// Prevent re-cancelling
	if (booking.status === "cancelled") {
		return { success: false, error: "Booking is already cancelled" };
	}

	// Update booking to cancelled and create audit log in a transaction
	const [updated] = await db.$transaction([
		db.bookingRequest.update({
			where: { id: bookingId },
			data: {
				status: "cancelled",
				reviewedAt: new Date(),
				reviewedBy: adminUserId,
				reviewNotes: reason
					? `Cancellation reason: ${reason}`
					: "Booking cancelled by administrator",
			},
			select: {
				id: true,
				status: true,
				reviewedAt: true,
				reviewNotes: true,
			},
		}),
		db.auditLog.create({
			data: {
				userId: adminUserId,
				action: "booking_cancelled_by_admin",
				entity: "booking",
				entityId: bookingId,
				metadata: {
					referenceNumber: booking.referenceNumber,
					reason: reason || null,
					previousStatus: booking.status,
					targetUserId: booking.userId,
				},
			},
		}),
	]);

	// Send email notification to user (async, non-blocking)
	const userName = `${booking.user.firstName} ${booking.user.lastName}`;

	sendBookingCancelledByAdminEmail({
		to: booking.user.email,
		userName,
		referenceNumber: booking.referenceNumber,
		reason,
		bookingId,
		userId: booking.userId,
	}).catch((error) => {
		console.error(
			"[cancelBookingByAdmin] Failed to send user notification:",
			error,
		);
	});

	return {
		success: true,
		data: {
			id: updated.id,
			status: updated.status,
			reviewedAt: updated.reviewedAt?.toISOString() ?? null,
			reviewNotes: updated.reviewNotes,
		},
	};
}

/**
 * Update booking timeline (start/end dates)
 * - Validates authorization (owner or admin)
 * - Validates booking exists
 * - Prevents editing cancelled bookings
 * - Safely validates and parses dates
 * - Enforces date ordering constraints
 * - Creates audit log entry
 * - Updates preferred dates
 */
export async function updateBookingTimeline(
	params: UpdateBookingTimelineParams,
): Promise<UpdateBookingTimelineResult> {
	const { bookingId, preferredStartDate, preferredEndDate, userId, userRole } =
		params;

	// Check if booking exists
	const booking = await db.bookingRequest.findUnique({
		where: { id: bookingId },
		select: {
			id: true,
			status: true,
			userId: true,
			preferredStartDate: true,
			preferredEndDate: true,
			referenceNumber: true,
		},
	});

	if (!booking) {
		return {
			success: false,
			error: "Booking not found",
		};
	}

	// Authorization: must be booking owner or lab_administrator
	const isOwner = booking.userId === userId;
	const isAdmin = userRole === "lab_administrator";

	if (!isOwner && !isAdmin) {
		return {
			success: false,
			error: "Unauthorized: You can only edit your own bookings",
		};
	}

	// Prevent editing cancelled bookings
	if (booking.status === "cancelled") {
		return {
			success: false,
			error: "Cannot edit a cancelled booking",
		};
	}

	// Safe date parsing and validation
	let startDate: Date | null = null;
	let endDate: Date | null = null;

	if (preferredStartDate !== null) {
		const parsed = new Date(preferredStartDate);
		if (Number.isNaN(parsed.getTime())) {
			return {
				success: false,
				error: "Invalid preferredStartDate format",
			};
		}
		startDate = parsed;
	}

	if (preferredEndDate !== null) {
		const parsed = new Date(preferredEndDate);
		if (Number.isNaN(parsed.getTime())) {
			return {
				success: false,
				error: "Invalid preferredEndDate format",
			};
		}
		endDate = parsed;
	}

	// Enforce date ordering: startDate <= endDate when both provided
	if (startDate !== null && endDate !== null && startDate > endDate) {
		return {
			success: false,
			error: "preferredStartDate must be before or equal to preferredEndDate",
		};
	}

	// Update the booking and create audit log in a transaction
	const [updated] = await db.$transaction([
		db.bookingRequest.update({
			where: { id: bookingId },
			data: {
				preferredStartDate: startDate,
				preferredEndDate: endDate,
			},
			select: {
				id: true,
				preferredStartDate: true,
				preferredEndDate: true,
			},
		}),
		db.auditLog.create({
			data: {
				userId,
				action: "booking_timeline_updated",
				entity: "booking",
				entityId: bookingId,
				metadata: {
					referenceNumber: booking.referenceNumber,
					previousStartDate: booking.preferredStartDate?.toISOString() ?? null,
					previousEndDate: booking.preferredEndDate?.toISOString() ?? null,
					newStartDate: startDate?.toISOString() ?? null,
					newEndDate: endDate?.toISOString() ?? null,
					updatedBy: isAdmin ? "admin" : "owner",
				},
			},
		}),
	]);

	return {
		success: true,
		data: {
			id: updated.id,
			preferredStartDate: updated.preferredStartDate?.toISOString() ?? null,
			preferredEndDate: updated.preferredEndDate?.toISOString() ?? null,
		},
	};
}
