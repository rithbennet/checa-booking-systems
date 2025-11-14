/**
 * Booking entity API - Get available lab equipment
 */

import type { LabEquipment } from "@/entities/booking";
import { db } from "@/shared/server/db";

export interface GetAvailableEquipmentParams {
	onlyAvailable?: boolean;
	limit?: number;
	offset?: number;
}

export async function getAvailableEquipment(
	params: GetAvailableEquipmentParams = {},
): Promise<LabEquipment[]> {
	const { onlyAvailable = true, limit = 100, offset = 0 } = params;

	const where: Record<string, unknown> = {};
	if (onlyAvailable) where.isAvailable = true;

	const items = await db.labEquipment.findMany({
		where,
		orderBy: { name: "asc" },
		take: limit,
		skip: offset,
	});

	return items.map((i) => ({
		id: i.id,
		name: i.name,
		description: i.description ?? undefined,
		isAvailable: Boolean(i.isAvailable),
		maintenanceNotes: i.maintenanceNotes ?? undefined,
		expectedMaintenanceEnd: i.expectedMaintenanceEnd ?? undefined,
		createdAt: i.createdAt,
		updatedAt: i.updatedAt,
	}));
}
