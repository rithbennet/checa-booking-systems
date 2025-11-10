/**
 * Service entity API hooks using TanStack Query
 */

import { useQuery } from "@tanstack/react-query";
import type { Service, ServiceFilters, ServiceSortOption } from "../model/types";

export const serviceKeys = {
	all: ["services"] as const,
	lists: () => [...serviceKeys.all, "list"] as const,
	list: (filters?: ServiceFilters, sort?: ServiceSortOption) =>
		[...serviceKeys.lists(), filters, sort] as const,
	details: () => [...serviceKeys.all, "detail"] as const,
	detail: (id: string) => [...serviceKeys.details(), id] as const,
};

async function fetchServices(
	filters?: ServiceFilters,
	sort?: ServiceSortOption,
): Promise<Service[]> {
	const params = new URLSearchParams();
	if (filters?.category && filters.category !== "all") {
		params.set("category", filters.category);
	}
	if (filters?.search) {
		params.set("search", filters.search);
	}
	if (filters?.availability && filters.availability !== "all") {
		params.set("availability", filters.availability);
	}
	if (filters?.userType) {
		params.set("userType", filters.userType);
	}
	if (filters?.priceRange) {
		params.set("priceMin", filters.priceRange[0]?.toString() ?? "0");
		params.set("priceMax", filters.priceRange[1]?.toString() ?? "1000");
	}
	if (sort) {
		params.set("sortField", sort.field);
		params.set("sortDirection", sort.direction);
	}

	const response = await fetch(`/api/services?${params.toString()}`);
	if (!response.ok) {
		throw new Error("Failed to fetch services");
	}
	return response.json();
}

async function fetchService(id: string): Promise<Service | null> {
	const response = await fetch(`/api/services/${id}`);
	if (!response.ok) {
		if (response.status === 404) return null;
		throw new Error("Failed to fetch service");
	}
	return response.json();
}

export function useServices(
	filters?: ServiceFilters,
	sort?: ServiceSortOption,
) {
	return useQuery({
		queryKey: serviceKeys.list(filters, sort),
		queryFn: () => fetchServices(filters, sort),
	});
}

export function useService(id: string | null | undefined) {
	return useQuery({
		queryKey: serviceKeys.detail(id ?? ""),
		queryFn: () => {
			if (!id) return null;
			return fetchService(id);
		},
		enabled: !!id,
	});
}

