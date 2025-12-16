import { useQuery } from "@tanstack/react-query";
import type { AdminDashboardMetricsVM } from "../model/types";
import { adminDashboardKeys } from "./query-keys";

async function fetchMetrics(): Promise<AdminDashboardMetricsVM> {
	const res = await fetch("/api/admin/dashboard/metrics");
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.error || "Failed to fetch dashboard metrics");
	}
	return res.json();
}

export function useAdminDashboardMetrics() {
	return useQuery<AdminDashboardMetricsVM>({
		queryKey: adminDashboardKeys.metrics(),
		queryFn: fetchMetrics,
		staleTime: 5 * 60_000, // 5 minutes
		refetchOnWindowFocus: false,
	});
}
