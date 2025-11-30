/**
 * Admin Equipment API Hooks
 *
 * TanStack Query hooks for equipment administration
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { equipmentAdminKeys } from "../model/query-keys";
import type {
	AdminEquipmentDetail,
	AdminEquipmentFilters,
	AdminEquipmentListResponse,
	EquipmentUpsertInput,
} from "../model/types";

/**
 * Hook to fetch paginated list of equipment for admin
 */
export function useAdminEquipment(filters: AdminEquipmentFilters = {}) {
	return useQuery<AdminEquipmentListResponse>({
		queryKey: equipmentAdminKeys.list(filters),
		queryFn: async () => {
			const searchParams = new URLSearchParams();

			if (filters.search) {
				searchParams.set("search", filters.search);
			}
			if (filters.availability) {
				searchParams.set("availability", filters.availability);
			}
			if (filters.page) {
				searchParams.set("page", String(filters.page));
			}
			if (filters.perPage) {
				searchParams.set("perPage", String(filters.perPage));
			}

			const res = await fetch(
				`/api/admin/equipment?${searchParams.toString()}`,
			);
			if (!res.ok) {
				throw new Error("Failed to fetch equipment");
			}
			return res.json();
		},
	});
}

/**
 * Hook to fetch a single equipment detail for editing
 */
export function useAdminEquipmentDetail(id: string | null) {
	return useQuery<AdminEquipmentDetail | null>({
		queryKey: equipmentAdminKeys.detail(id ?? ""),
		queryFn: async () => {
			if (!id) return null;

			const res = await fetch(`/api/admin/equipment/${id}`);
			if (!res.ok) {
				if (res.status === 404) return null;
				throw new Error("Failed to fetch equipment detail");
			}
			return res.json();
		},
		enabled: !!id,
	});
}

/**
 * Hook to upsert equipment (create or update)
 */
export function useUpsertEquipment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: EquipmentUpsertInput) => {
			const res = await fetch("/api/admin/equipment", {
				method: input.id ? "PUT" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			});

			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.message || "Failed to save equipment");
			}

			return res.json();
		},
		onSuccess: (data) => {
			// Invalidate list queries
			queryClient.invalidateQueries({
				queryKey: equipmentAdminKeys.all,
			});
			// Invalidate the specific detail query if updating
			if (data?.id) {
				queryClient.invalidateQueries({
					queryKey: equipmentAdminKeys.detail(data.id),
				});
			}
		},
	});
}

/**
 * Hook to toggle equipment availability
 */
export function useToggleEquipmentAvailability() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			isAvailable,
		}: {
			id: string;
			isAvailable: boolean;
		}) => {
			const res = await fetch(`/api/admin/equipment/${id}/toggle`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isAvailable }),
			});

			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(
					error.message || "Failed to toggle equipment availability",
				);
			}

			return res.json();
		},
		onSuccess: (_data, variables) => {
			// Invalidate list queries
			queryClient.invalidateQueries({
				queryKey: equipmentAdminKeys.all,
			});
			// Invalidate the specific detail query
			queryClient.invalidateQueries({
				queryKey: equipmentAdminKeys.detail(variables.id),
			});
		},
	});
}
