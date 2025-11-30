/**
 * Admin Equipment Query Keys
 *
 * Query key factory for TanStack Query caching
 */

import type { AdminEquipmentFilters } from "./types";

export const equipmentAdminKeys = {
	all: ["admin", "equipment"] as const,
	list: (filters: AdminEquipmentFilters) =>
		[...equipmentAdminKeys.all, "list", filters] as const,
	detail: (id: string) => [...equipmentAdminKeys.all, "detail", id] as const,
};
