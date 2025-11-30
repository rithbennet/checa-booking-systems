/**
 * Sample Tracking Entity Queries
 * TanStack Query hooks for sample operations
 */

import { useQuery } from "@tanstack/react-query";
import { sampleTrackingKeys } from "./query-keys";
import type {
	SampleOperationsRow,
	UserActiveSample,
	UserSampleResultRow,
} from "./types";

/**
 * Fetch sample operations list (admin)
 */
async function fetchSampleOperationsList(params: {
	status?: string[];
	q?: string;
	page?: number;
	pageSize?: number;
}): Promise<{
	items: SampleOperationsRow[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}> {
	const searchParams = new URLSearchParams();
	if (params.status?.length) {
		for (const s of params.status) {
			searchParams.append("status", s);
		}
	}
	if (params.q) searchParams.set("q", params.q);
	if (params.page) searchParams.set("page", String(params.page));
	if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));

	const res = await fetch(`/api/admin/samples?${searchParams.toString()}`);
	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		throw new Error(error.error || "Failed to fetch samples");
	}
	return res.json();
}

/**
 * Fetch user active samples (dashboard widget)
 * Reuses the user samples endpoint and filters client-side
 */
async function fetchUserActiveSamples(): Promise<{
	items: UserActiveSample[];
}> {
	const res = await fetch("/api/user/samples");
	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		throw new Error(error.error || "Failed to fetch user samples");
	}
	const data = await res.json();
	// Filter to only show active samples (exclude returned)
	const activeSamples = data.items
		.filter(
			(item: UserSampleResultRow) =>
				item.status !== "returned" && item.status !== "return_requested",
		)
		.map((item: UserSampleResultRow) => ({
			id: item.id,
			sampleIdentifier: item.sampleIdentifier,
			serviceName: item.serviceName,
			status: item.status,
			bookingId: item.bookingId,
			createdAt: item.createdAt,
		}));
	return { items: activeSamples };
}

/**
 * Fetch user sample results (results page)
 */
async function fetchUserSampleResults(): Promise<{
	items: UserSampleResultRow[];
}> {
	const res = await fetch("/api/user/samples");
	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		throw new Error(error.error || "Failed to fetch sample results");
	}
	return res.json();
}

/**
 * Hook to get sample operations list (admin)
 */
export function useSampleOperationsList(params: {
	status?: string[];
	q?: string;
	page?: number;
	pageSize?: number;
}) {
	return useQuery({
		queryKey: sampleTrackingKeys.operationsList(params),
		queryFn: () => fetchSampleOperationsList(params),
		staleTime: 60 * 1000, // 1 minute
		keepPreviousData: true,
	});
}

/**
 * Hook to get user active samples (dashboard widget)
 * No longer requires userId - uses authenticated user from session
 */
export function useUserActiveSamples() {
	return useQuery({
		queryKey: sampleTrackingKeys.userActive("current"),
		queryFn: fetchUserActiveSamples,
		staleTime: 60 * 1000, // 1 minute
	});
}

/**
 * Hook to get user sample results (results page)
 * Shows all samples with payment/download status
 */
export function useUserSampleResults() {
	return useQuery({
		queryKey: sampleTrackingKeys.userResults(),
		queryFn: fetchUserSampleResults,
		staleTime: 60 * 1000, // 1 minute
	});
}
