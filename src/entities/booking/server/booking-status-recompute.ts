/**
 * Booking Status Recompute
 *
 * Server-side helper to automatically transition booking status based on sample states.
 * This is the ONLY place that should set booking status to `in_progress` or `completed`.
 *
 * Status Transitions:
 * - `approved` → waiting for lab work (no samples in active states)
 * - `in_progress` → at least one sample is in an active state (received, in_analysis, etc.)
 * - `completed` → all samples are in terminal states (analysis_complete, returned, etc.)
 */

import type { booking_status_enum, sample_status_enum } from "generated/prisma";
import { notifyBookingCompleted } from "@/entities/notification/server/booking.notifications";
import { db } from "@/shared/server/db";

/**
 * Sample statuses considered "active" (lab work in progress)
 */
const ACTIVE_SAMPLE_STATUSES: sample_status_enum[] = [
	"received",
	"in_analysis",
	"return_requested",
];

/**
 * Sample statuses considered "terminal" (lab work complete)
 */
const TERMINAL_SAMPLE_STATUSES: sample_status_enum[] = [
	"analysis_complete",
	"returned",
];

/**
 * Booking statuses that can be auto-transitioned by this helper
 */
const RECOMPUTABLE_BOOKING_STATUSES: booking_status_enum[] = [
	"approved",
	"in_progress",
];

export interface RecomputeResult {
	bookingId: string;
	previousStatus: booking_status_enum;
	newStatus: booking_status_enum;
	changed: boolean;
	releasedAt?: Date;
}

/**
 * Recompute booking status based on all sample statuses.
 *
 * Call this after any sample status change.
 *
 * Logic:
 * 1. Load all samples (and workspace bookings) for the booking
 * 2. If no samples have started → keep `approved`
 * 3. If at least one sample is in an active state → set `in_progress`
 * 4. If all samples are in terminal states → set `completed` and stamp `releasedAt`
 *
 * @param bookingId The booking ID to recompute
 * @returns RecomputeResult with the status change details
 */
export async function recomputeBookingStatus(
	bookingId: string,
): Promise<RecomputeResult> {
	// Fetch booking with all samples
	const booking = await db.bookingRequest.findUnique({
		where: { id: bookingId },
		select: {
			id: true,
			status: true,
			userId: true,
			referenceNumber: true,
			releasedAt: true,
			serviceItems: {
				include: {
					service: {
						select: { requiresSample: true },
					},
					sampleTracking: {
						select: { status: true },
					},
				},
			},
			workspaceBookings: {
				select: {
					id: true,
					endDate: true,
				},
			},
		},
	});

	if (!booking) {
		throw new Error(`Booking not found: ${bookingId}`);
	}

	const previousStatus = booking.status;

	// Only recompute for approved or in_progress bookings
	if (!RECOMPUTABLE_BOOKING_STATUSES.includes(previousStatus)) {
		return {
			bookingId,
			previousStatus,
			newStatus: previousStatus,
			changed: false,
		};
	}

	// Collect all sample statuses from service items that require samples
	const sampleStatuses: sample_status_enum[] = [];
	for (const item of booking.serviceItems) {
		if (item.service.requiresSample) {
			for (const tracking of item.sampleTracking) {
				sampleStatuses.push(tracking.status);
			}
		}
	}

	// Determine new status based on sample states
	let newStatus: booking_status_enum = previousStatus;

	if (sampleStatuses.length === 0) {
		// No samples to track - stay approved (workspace-only bookings will complete based on end date)
		// Check if this is a workspace-only booking that has ended
		const now = new Date();
		const allWorkspacesEnded =
			booking.workspaceBookings.length > 0 &&
			booking.workspaceBookings.every((ws) => new Date(ws.endDate) <= now);

		if (allWorkspacesEnded) {
			newStatus = "completed";
		} else {
			newStatus = "approved";
		}
	} else {
		// Check sample states
		const hasActiveSamples = sampleStatuses.some((s) =>
			ACTIVE_SAMPLE_STATUSES.includes(s),
		);
		const allTerminal = sampleStatuses.every((s) =>
			TERMINAL_SAMPLE_STATUSES.includes(s),
		);
		const hasPendingSamples = sampleStatuses.some((s) => s === "pending");

		if (allTerminal) {
			// All samples are in terminal states
			newStatus = "completed";
		} else if (hasActiveSamples) {
			// At least one sample is actively being processed
			newStatus = "in_progress";
		} else if (hasPendingSamples && !hasActiveSamples) {
			// Samples exist but none have started - keep approved
			newStatus = "approved";
		}
	}

	// Only update if status changed
	if (newStatus === previousStatus) {
		return {
			bookingId,
			previousStatus,
			newStatus,
			changed: false,
		};
	}

	// Update booking status
	const updateData: {
		status: booking_status_enum;
		releasedAt?: Date;
	} = {
		status: newStatus,
	};

	// If transitioning to completed, stamp releasedAt
	let releasedAt: Date | undefined;
	if (newStatus === "completed" && !booking.releasedAt) {
		releasedAt = new Date();
		updateData.releasedAt = releasedAt;
	}

	await db.bookingRequest.update({
		where: { id: bookingId },
		data: updateData,
	});

	// Send notification only on transition to completed
	if (newStatus === "completed" && previousStatus !== "completed") {
		try {
			await notifyBookingCompleted({
				userId: booking.userId,
				bookingId: booking.id,
				bookingReference: booking.referenceNumber,
			});
		} catch (notifyError) {
			// Log but don't fail - notification is non-critical
			console.error(
				"[recomputeBookingStatus] Failed to send completion notification:",
				notifyError,
			);
		}
	}

	return {
		bookingId,
		previousStatus,
		newStatus,
		changed: true,
		releasedAt,
	};
}

/**
 * Admin override to force-complete a booking.
 *
 * Use this for rare cases where manual completion is needed.
 * Logs an audit entry for the override.
 *
 * ⚠️ SECURITY CRITICAL: This function performs a high-privilege state change.
 * The caller MUST verify that the requesting user has admin permissions
 * (lab_administrator role) BEFORE calling this function. This should be
 * enforced in the HTTP route/middleware that calls this function.
 *
 * Example authorization check required in API route:
 * ```typescript
 * if (user.role !== "lab_administrator") {
 *   return Response.json({ error: "Forbidden" }, { status: 403 });
 * }
 * ```
 *
 * @param bookingId The booking ID to complete
 * @param adminUserId The admin user performing the override (must be verified as admin)
 * @param reason The reason for the manual override
 */
export async function forceCompleteBooking(
	bookingId: string,
	adminUserId: string,
	reason: string,
): Promise<RecomputeResult> {
	const booking = await db.bookingRequest.findUnique({
		where: { id: bookingId },
		select: {
			id: true,
			status: true,
			userId: true,
			referenceNumber: true,
			releasedAt: true,
		},
	});

	if (!booking) {
		throw new Error(`Booking not found: ${bookingId}`);
	}

	const previousStatus = booking.status;

	// Don't complete if already completed
	if (previousStatus === "completed") {
		return {
			bookingId,
			previousStatus,
			newStatus: "completed",
			changed: false,
		};
	}

	const releasedAt = new Date();

	// Update booking
	await db.bookingRequest.update({
		where: { id: bookingId },
		data: {
			status: "completed",
			releasedAt,
		},
	});

	// Log audit entry for the override
	await db.auditLog.create({
		data: {
			userId: adminUserId,
			action: "booking_force_completed",
			entity: "booking_request",
			entityId: bookingId,
			metadata: {
				previousStatus,
				reason,
			},
		},
	});

	// Send completion notification
	try {
		await notifyBookingCompleted({
			userId: booking.userId,
			bookingId: booking.id,
			bookingReference: booking.referenceNumber,
		});
	} catch (notifyError) {
		console.error(
			"[forceCompleteBooking] Failed to send completion notification:",
			notifyError,
		);
	}

	return {
		bookingId,
		previousStatus,
		newStatus: "completed",
		changed: true,
		releasedAt,
	};
}
