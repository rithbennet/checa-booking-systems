/**
 * Admin Add-On API Hooks
 *
 * TanStack Query hooks for managing global add-ons
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addonAdminKeys } from "../model/query-keys";
import type { GlobalAddOn } from "../model/types";

export interface AddOnUpsertInput {
	id?: string;
	name: string;
	description: string | null;
	defaultAmount: number;
	applicableTo: "sample" | "workspace" | "both";
	isActive: boolean;
}

/**
 * Hook to fetch all global add-ons (including inactive)
 */
export function useAllGlobalAddOns() {
	return useQuery<GlobalAddOn[]>({
		queryKey: addonAdminKeys.all,
		queryFn: async () => {
			const res = await fetch("/api/admin/addons?all=true");
			if (!res.ok) {
				throw new Error("Failed to fetch all add-ons");
			}
			return res.json();
		},
	});
}

/**
 * Hook to upsert a global add-on (create or update)
 */
export function useUpsertAddOn() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: AddOnUpsertInput) => {
			const res = await fetch("/api/admin/addons", {
				method: input.id ? "PUT" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			});

			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.message || "Failed to save add-on");
			}

			return res.json();
		},
		onSuccess: () => {
			// Invalidate all add-on queries
			queryClient.invalidateQueries({
				queryKey: addonAdminKeys.all,
			});
		},
	});
}

/**
 * Hook to toggle add-on active status
 */
export function useToggleAddOnActive() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
			const res = await fetch(`/api/admin/addons/${id}/toggle`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isActive }),
			});

			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.message || "Failed to toggle add-on status");
			}

			return res.json();
		},
		onSuccess: () => {
			// Invalidate all add-on queries
			queryClient.invalidateQueries({
				queryKey: addonAdminKeys.all,
			});
		},
	});
}

/**
 * Hook to delete a global add-on
 */
export function useDeleteAddOn() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const res = await fetch(`/api/admin/addons/${id}`, {
				method: "DELETE",
			});

			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.message || "Failed to delete add-on");
			}

			return res.json();
		},
		onSuccess: () => {
			// Invalidate all add-on queries
			queryClient.invalidateQueries({
				queryKey: addonAdminKeys.all,
			});
		},
	});
}
