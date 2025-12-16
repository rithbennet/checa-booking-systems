import type { AdminDashboardActivityVM } from "../model/types";
import { createAdminDashboardQuery } from "./create-admin-dashboard-query";
import { adminDashboardKeys } from "./query-keys";

const useAdminDashboardActivityQuery =
	createAdminDashboardQuery<AdminDashboardActivityVM>({
		endpoint: "/api/admin/dashboard/activity",
		queryKey: adminDashboardKeys.activity(),
		errorMessage: "Failed to fetch dashboard activity",
		staleTime: 2 * 60_000, // 2 minutes (activity updates more frequently)
		refetchOnWindowFocus: true,
	});

export function useAdminDashboardActivity() {
	return useAdminDashboardActivityQuery();
}
