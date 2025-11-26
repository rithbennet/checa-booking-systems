/**
 * Admin Service Query Keys
 *
 * Query key factory for TanStack Query caching
 */

import type { AdminServiceFilters } from "./admin-types";

export const serviceAdminKeys = {
	all: ["admin", "services"] as const,
	list: (filters: AdminServiceFilters) =>
		[...serviceAdminKeys.all, "list", filters] as const,
	detail: (id: string) => [...serviceAdminKeys.all, "detail", id] as const,
};
