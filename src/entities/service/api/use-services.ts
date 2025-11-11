/**
 * Service entity API hooks using TanStack Query
 */

import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import type {
	Service,
	ServiceFilters,
	ServiceSortOption,
} from "../model/types";

/**
 * Serialize filters to a stable string for query keys
 */
function serializeFilters(filters?: ServiceFilters): string {
	if (!filters) return "default";
	const parts: string[] = [];
	if (filters.category && filters.category !== "all") {
		parts.push(`cat:${filters.category}`);
	}
	if (filters.search) {
		parts.push(`search:${filters.search}`);
	}
	if (filters.availability && filters.availability !== "all") {
		parts.push(`avail:${filters.availability}`);
	}
	if (filters.userType) {
		parts.push(`type:${filters.userType}`);
	}
	if (filters.priceRange) {
		parts.push(`price:${filters.priceRange[0]}-${filters.priceRange[1]}`);
	}
	return parts.length > 0 ? parts.join("|") : "default";
}

function serializeSort(sort?: ServiceSortOption): string {
	if (!sort) return "default";
	return `${sort.field}:${sort.direction}`;
}

export const serviceKeys = {
	all: ["services"] as const,
	lists: () => [...serviceKeys.all, "list"] as const,
	list: (filters?: ServiceFilters, sort?: ServiceSortOption) =>
		[
			...serviceKeys.lists(),
			serializeFilters(filters),
			serializeSort(sort),
		] as const,
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
	// For small datasets, we can fetch all services and filter client-side
	// Only pass userType to get correct pricing - ignore other filters for API call
	const queryFilters: ServiceFilters | undefined = filters?.userType
		? { userType: filters.userType }
		: undefined;

	const queryKey = serviceKeys.list(queryFilters, sort);

	const queryOptions: UseQueryOptions<Service[], Error> = {
		queryKey,
		queryFn: () => fetchServices(queryFilters, sort),
		staleTime: 10 * 60 * 1000, // 10 minutes - services rarely change
		cacheTime: 30 * 60 * 1000, // 30 minutes garbage collection (v4 uses cacheTime)
		refetchOnWindowFocus: false,
		refetchOnMount: false, // Don't refetch if data exists
		refetchOnReconnect: false, // Don't refetch on reconnect
	};

	return useQuery(queryOptions);
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
