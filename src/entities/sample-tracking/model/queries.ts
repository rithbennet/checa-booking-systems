/**
 * Sample Tracking Entity Queries
 * TanStack Query hooks for sample operations
 */

import { useQuery } from "@tanstack/react-query";
import { sampleTrackingKeys } from "./query-keys";
import type { SampleOperationsRow, UserActiveSample } from "./types";

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
 */
async function fetchUserActiveSamples(
  userId: string
): Promise<{ items: UserActiveSample[] }> {
  const searchParams = new URLSearchParams();
  searchParams.set("userId", userId);
  searchParams.set("exclude", "returned");

  const res = await fetch(`/api/admin/samples?${searchParams.toString()}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch user samples");
  }
  const data = await res.json();
  return { items: data.items };
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
 */
export function useUserActiveSamples(userId: string | null | undefined) {
  return useQuery({
    queryKey: sampleTrackingKeys.userActive(userId ?? ""),
    queryFn: () => {
      if (!userId) throw new Error("User ID is required");
      return fetchUserActiveSamples(userId);
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
  });
}
