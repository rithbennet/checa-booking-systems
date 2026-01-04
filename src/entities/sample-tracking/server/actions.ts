/**
 * Sample Tracking Service Actions
 * Business logic layer for sample tracking operations
 */

import type { sample_status_enum } from "generated/prisma";
import { recomputeBookingStatus } from "@/entities/booking/server/booking-status-recompute";
import { notifySampleStatusChanged } from "@/entities/notification/server/sample.notifications";
import { mapSampleToOperationsRow } from "../lib/mappers";
import * as repo from "./repository";

/**
 * List samples for operations (admin view)
 */
export async function listSamples(params: {
	status?: string[];
	q?: string;
	userId?: string;
	exclude?: string[];
	page: number;
	pageSize: number;
}) {
	const { status, exclude, page, pageSize } = params;

	// Fetch BookingServiceItems
	const serviceItems = await repo.findSampleTrackingList(params);

	// Process items: use existing SampleTracking or create ones from BookingServiceItem
	const processedSamples = await Promise.all(
		serviceItems.map(async (item) => {
			// If SampleTracking exists, use it
			if (item.sampleTracking && item.sampleTracking.length > 0) {
				const tracking = item.sampleTracking[0];
				if (tracking) {
					const fullTracking = await repo.findSampleById(tracking.id);
					if (fullTracking) {
						return fullTracking;
					}
				}
			}

			// Create SampleTracking record if it doesn't exist
			return repo.findOrCreateSampleTracking(item.id, item.sampleName);
		}),
	);

	// Apply status filters
	const filteredSamples = processedSamples.filter((s) => {
		if (status && status.length > 0) {
			return status.includes(s.status);
		}
		if (exclude && exclude.length > 0) {
			return !exclude.includes(s.status);
		}
		return true;
	});

	// Apply pagination after filtering
	const paginatedSamples = filteredSamples.slice(
		(page - 1) * pageSize,
		page * pageSize,
	);

	const items = paginatedSamples.map(mapSampleToOperationsRow);
	const total = filteredSamples.length;

	return {
		items,
		total,
		page,
		pageSize,
		totalPages: Math.ceil(total / pageSize),
	};
}

/**
 * Statuses that trigger notifications to the user
 */
const NOTIFIABLE_STATUSES = [
	"received",
	"in_analysis",
	"analysis_complete",
	"return_requested",
	"returned",
] as const;

type NotifiableStatus = (typeof NOTIFIABLE_STATUSES)[number];

/**
 * Update sample status
 * Sends notification to user for status changes
 */
export async function updateSampleStatus(params: {
	sampleId: string;
	status: sample_status_enum;
	updatedBy: string;
	notes?: string;
}) {
	const { sampleId, status, updatedBy, notes } = params;

	// Verify sample exists
	const existing = await repo.findSampleById(sampleId);
	if (!existing) {
		throw new Error("Sample not found");
	}

	// Update status
	const updated = await repo.updateSampleStatusWithNotificationData(
		sampleId,
		status,
		updatedBy,
	);

	// Send notification to user for relevant status changes
	// This is done AFTER the DB commit (not in transaction) to ensure data consistency
	// Type guard to check if status is notifiable
	const isNotifiableStatus = (s: sample_status_enum): s is NotifiableStatus => {
		return (NOTIFIABLE_STATUSES as readonly string[]).includes(s);
	};

	if (isNotifiableStatus(status)) {
		try {
			await notifySampleStatusChanged({
				userId: updated.bookingServiceItem.bookingRequest.userId,
				sampleId: updated.id,
				sampleIdentifier: updated.sampleIdentifier,
				serviceName: updated.bookingServiceItem.service.name,
				bookingReference:
					updated.bookingServiceItem.bookingRequest.referenceNumber,
				status,
				notes,
			});
		} catch (notifyError) {
			// Log but don't fail the request - notification is non-critical
			console.error(
				"[SampleTracking] Failed to send notification:",
				notifyError,
			);
		}
	}

	// Recompute booking status after sample status change
	// This may transition the booking to in_progress or completed
	try {
		const bookingId = updated.bookingServiceItem.bookingRequest.id;
		const recomputeResult = await recomputeBookingStatus(bookingId);
		if (recomputeResult.changed) {
			console.log(
				`[SampleTracking] Booking ${bookingId} status changed: ${recomputeResult.previousStatus} → ${recomputeResult.newStatus}`,
			);
		}
	} catch (recomputeError) {
		// Log but don't fail - booking status recompute is non-critical to sample update
		console.error(
			"[SampleTracking] Failed to recompute booking status:",
			recomputeError,
		);
	}

	return mapSampleToOperationsRow(updated);
}
