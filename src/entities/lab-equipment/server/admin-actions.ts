/**
 * Admin Equipment Actions
 *
 * Server actions for equipment management (upsert, toggle)
 */

"use server";

import { db } from "@/shared/server/db";
import {
	type EquipmentUpsertInput,
	equipmentUpsertInputSchema,
} from "../model/types";

/**
 * Upsert lab equipment (create or update)
 *
 * @param input - Equipment data
 * @returns The created/updated equipment ID
 */
export async function upsertAdminEquipment(
	input: EquipmentUpsertInput,
): Promise<{ id: string }> {
	// Validate input
	const parsed = equipmentUpsertInputSchema.parse(input);

	const {
		id,
		name,
		description,
		isAvailable,
		maintenanceNotes,
		expectedMaintenanceEnd,
	} = parsed;

	// Parse date if provided
	const maintenanceEndDate = expectedMaintenanceEnd
		? new Date(expectedMaintenanceEnd)
		: null;

	if (id) {
		// Update existing equipment
		const updated = await db.labEquipment.update({
			where: { id },
			data: {
				name,
				description,
				isAvailable,
				maintenanceNotes,
				expectedMaintenanceEnd: maintenanceEndDate,
			},
		});
		return { id: updated.id };
	}

	// Create new equipment
	const created = await db.labEquipment.create({
		data: {
			name,
			description,
			isAvailable,
			maintenanceNotes,
			expectedMaintenanceEnd: maintenanceEndDate,
		},
	});
	return { id: created.id };
}

/**
 * Toggle equipment availability status
 *
 * @param id - Equipment ID
 * @param isAvailable - New availability status
 */
export async function toggleEquipmentAvailability(
	id: string,
	isAvailable: boolean,
): Promise<{ id: string; isAvailable: boolean }> {
	const updated = await db.labEquipment.update({
		where: { id },
		data: { isAvailable },
		select: { id: true, isAvailable: true },
	});

	return updated;
}
