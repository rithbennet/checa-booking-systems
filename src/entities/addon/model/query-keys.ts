/**
 * Add-On Query Keys
 *
 * Query key factory for TanStack Query caching
 */

export const addonAdminKeys = {
	all: ["admin", "addons"] as const,
	list: () => [...addonAdminKeys.all, "list"] as const,
};
