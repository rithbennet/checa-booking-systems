/**
 * Sample Tracking Service Actions
 * Business logic layer for sample tracking operations
 */

import type { sample_status_enum } from "generated/prisma";
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
 * Update sample status
 */
export async function updateSampleStatus(params: {
	sampleId: string;
	status: sample_status_enum;
	updatedBy: string;
}) {
	const { sampleId, status, updatedBy } = params;

	// Verify sample exists
	const existing = await repo.findSampleById(sampleId);
	if (!existing) {
		throw new Error("Sample not found");
	}

	// Update status
	const updated = await repo.updateSampleStatus(sampleId, status, updatedBy);

	return mapSampleToOperationsRow(updated);
}
