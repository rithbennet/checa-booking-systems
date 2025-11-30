/**
 * Global Add-On API Hooks
 *
 * TanStack Query hooks for global add-on catalog (read-only)
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { addonAdminKeys } from "../model/query-keys";
import type { GlobalAddOn } from "../model/types";

/**
 * Hook to fetch all active global add-ons
 */
export function useGlobalAddOns() {
	return useQuery<GlobalAddOn[]>({
		queryKey: addonAdminKeys.list(),
		queryFn: async () => {
			const res = await fetch("/api/admin/addons");
			if (!res.ok) {
				throw new Error("Failed to fetch global add-ons");
			}
			return res.json();
		},
	});
}
