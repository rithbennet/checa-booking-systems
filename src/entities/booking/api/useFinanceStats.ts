"use client";

import { useQuery } from "@tanstack/react-query";
import type { FinanceStatsVM } from "../server/finance-repository";

export const financeKeys = {
	all: ["finance"] as const,
	stats: () => [...financeKeys.all, "stats"] as const,
	overview: (params: Record<string, unknown>) =>
		[...financeKeys.all, "overview", params] as const,
	resultsOnHold: (params: Record<string, unknown>) =>
		[...financeKeys.all, "resultsOnHold", params] as const,
};

export function useFinanceStats() {
	return useQuery<FinanceStatsVM>({
		queryKey: financeKeys.stats(),
		queryFn: async () => {
			const res = await fetch("/api/admin/finance/stats");
			if (!res.ok) {
				throw new Error("Failed to fetch finance stats");
			}
			return res.json();
		},
	});
}
