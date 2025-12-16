import { useQuery } from "@tanstack/react-query";
import type { AdminDashboardActivityVM } from "../model/types";
import { adminDashboardKeys } from "./query-keys";

async function fetchActivity(): Promise<AdminDashboardActivityVM> {
	const res = await fetch("/api/admin/dashboard/activity");
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.error || "Failed to fetch dashboard activity");
	}
	return res.json();
}

export function useAdminDashboardActivity() {
	return useQuery<AdminDashboardActivityVM>({
		queryKey: adminDashboardKeys.activity(),
		queryFn: fetchActivity,
		staleTime: 2 * 60_000, // 2 minutes (activity updates more frequently)
		refetchOnWindowFocus: true,
	});
}
