import type { AdminDashboardMetricsVM } from "../model/types";
import { createAdminDashboardQuery } from "./create-admin-dashboard-query";
import { adminDashboardKeys } from "./query-keys";

const useAdminDashboardMetricsQuery =
	createAdminDashboardQuery<AdminDashboardMetricsVM>({
		endpoint: "/api/admin/dashboard/metrics",
		queryKey: adminDashboardKeys.metrics(),
		errorMessage: "Failed to fetch dashboard metrics",
		staleTime: 5 * 60_000, // 5 minutes
		refetchOnWindowFocus: false,
	});

export function useAdminDashboardMetrics() {
	return useAdminDashboardMetricsQuery();
}
