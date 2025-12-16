import type { AdminDashboardStatusVM } from "../model/types";
import { adminDashboardKeys } from "./query-keys";
import { createAdminDashboardQuery } from "./create-admin-dashboard-query";

const useAdminDashboardStatusQuery = createAdminDashboardQuery<AdminDashboardStatusVM>({
	endpoint: "/api/admin/dashboard/status",
	queryKey: adminDashboardKeys.status(),
	errorMessage: "Failed to fetch dashboard status",
	staleTime: 5 * 60_000, // 5 minutes
	refetchOnWindowFocus: false,
});

export function useAdminDashboardStatus() {
	return useAdminDashboardStatusQuery();
}
