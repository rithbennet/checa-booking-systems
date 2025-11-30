/**
 * Admin Service API Hooks
 *
 * TanStack Query hooks for service administration
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
	AdminServiceDetail,
	AdminServiceFilters,
	AdminServiceListResponse,
	ServiceUpsertInput,
} from "../model/admin-types";
import { serviceAdminKeys } from "../model/query-keys";

/**
 * Hook to fetch paginated list of services for admin
 */
export function useAdminServices(filters: AdminServiceFilters = {}) {
	return useQuery<AdminServiceListResponse>({
		queryKey: serviceAdminKeys.list(filters),
		queryFn: async () => {
			const searchParams = new URLSearchParams();

			if (filters.search) {
				searchParams.set("search", filters.search);
			}
			if (filters.category) {
				searchParams.set("category", filters.category);
			}
			if (filters.status) {
				searchParams.set("status", filters.status);
			}
			if (filters.page) {
				searchParams.set("page", String(filters.page));
			}
			if (filters.perPage) {
				searchParams.set("perPage", String(filters.perPage));
			}

			const res = await fetch(`/api/admin/services?${searchParams.toString()}`);
			if (!res.ok) {
				throw new Error("Failed to fetch services");
			}
			return res.json();
		},
	});
}

/**
 * Hook to fetch a single service detail for editing
 */
export function useAdminServiceDetail(id: string | null) {
	return useQuery<AdminServiceDetail | null>({
		queryKey: serviceAdminKeys.detail(id ?? ""),
		queryFn: async () => {
			if (!id) return null;

			const res = await fetch(`/api/admin/services/${id}`);
			if (!res.ok) {
				if (res.status === 404) return null;
				throw new Error("Failed to fetch service detail");
			}
			return res.json();
		},
		enabled: !!id,
	});
}

/**
 * Hook to upsert a service (create or update)
 */
export function useUpsertService() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: ServiceUpsertInput) => {
			const res = await fetch("/api/admin/services", {
				method: input.id ? "PUT" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			});

			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.message || "Failed to save service");
			}

			return res.json();
		},
		onSuccess: (data) => {
			// Invalidate list queries
			queryClient.invalidateQueries({
				queryKey: serviceAdminKeys.all,
			});
			// Invalidate the specific detail query if updating
			if (data?.id) {
				queryClient.invalidateQueries({
					queryKey: serviceAdminKeys.detail(data.id),
				});
			}
		},
	});
}

/**
 * Hook to toggle service active status
 */
export function useToggleServiceActive() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
			const res = await fetch(`/api/admin/services/${id}/toggle`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isActive }),
			});

			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.message || "Failed to toggle service status");
			}

			return res.json();
		},
		onSuccess: (_data, variables) => {
			// Invalidate list queries
			queryClient.invalidateQueries({
				queryKey: serviceAdminKeys.all,
			});
			// Invalidate the specific detail query
			queryClient.invalidateQueries({
				queryKey: serviceAdminKeys.detail(variables.id),
			});
		},
	});
}
