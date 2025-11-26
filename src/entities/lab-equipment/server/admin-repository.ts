/**
 * Admin Equipment Repository
 *
 * Prisma queries for lab equipment administration
 */

import { db } from "@/shared/server/db";
import type { Prisma } from "../../../../generated/prisma";
import type {
	AdminEquipmentDetail,
	AdminEquipmentFilters,
	AdminEquipmentListItem,
	AdminEquipmentListResponse,
} from "../model/types";

/**
 * Get paginated list of equipment for admin management
 */
export async function getAdminEquipment(
	filters: AdminEquipmentFilters = {},
): Promise<AdminEquipmentListResponse> {
	const { search, availability, page = 1, perPage = 20 } = filters;

	// Build where clause
	const where: Prisma.LabEquipmentWhereInput = {};

	// Availability filter
	if (availability === "available") {
		where.isAvailable = true;
	} else if (availability === "unavailable") {
		where.isAvailable = false;
	}

	// Search filter
	if (search?.trim()) {
		where.OR = [
			{ name: { contains: search, mode: "insensitive" } },
			{ description: { contains: search, mode: "insensitive" } },
		];
	}

	// Fetch data
	const [equipment, total] = await Promise.all([
		db.labEquipment.findMany({
			where,
			orderBy: { name: "asc" },
			skip: (page - 1) * perPage,
			take: perPage,
		}),
		db.labEquipment.count({ where }),
	]);

	// Map to AdminEquipmentListItem
	const items: AdminEquipmentListItem[] = equipment.map((e) => ({
		id: e.id,
		name: e.name,
		description: e.description,
		isAvailable: e.isAvailable,
		hasMaintenanceNotes: !!e.maintenanceNotes,
		expectedMaintenanceEnd: e.expectedMaintenanceEnd
			? e.expectedMaintenanceEnd.toISOString()
			: null,
		updatedAt: e.updatedAt.toISOString(),
	}));

	return {
		items,
		total,
		page,
		perPage,
	};
}

/**
 * Get detailed equipment information for editing
 */
export async function getAdminEquipmentDetail(
	id: string,
): Promise<AdminEquipmentDetail | null> {
	const equipment = await db.labEquipment.findUnique({
		where: { id },
	});

	if (!equipment) {
		return null;
	}

	return {
		id: equipment.id,
		name: equipment.name,
		description: equipment.description,
		isAvailable: equipment.isAvailable,
		maintenanceNotes: equipment.maintenanceNotes,
		expectedMaintenanceEnd: equipment.expectedMaintenanceEnd
			? equipment.expectedMaintenanceEnd.toISOString()
			: null,
		createdAt: equipment.createdAt.toISOString(),
		updatedAt: equipment.updatedAt.toISOString(),
	};
}
