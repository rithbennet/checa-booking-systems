import { useQuery } from "@tanstack/react-query";
import type { AdminDashboardStatusVM } from "../model/types";
import { adminDashboardKeys } from "./query-keys";

async function fetchStatus(): Promise<AdminDashboardStatusVM> {
	const res = await fetch("/api/admin/dashboard/status");
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.error || "Failed to fetch dashboard status");
	}
	return res.json();
}

export function useAdminDashboardStatus() {
	return useQuery<AdminDashboardStatusVM>({
		queryKey: adminDashboardKeys.status(),
		queryFn: fetchStatus,
		staleTime: 5 * 60_000, // 5 minutes
		refetchOnWindowFocus: false,
	});
}
