"use client";

import { useQuery } from "@tanstack/react-query";
import type {
	FinanceOverviewFilters,
	FinanceOverviewVM,
} from "../server/finance-repository";
import { financeKeys } from "./useFinanceStats";

interface FinanceOverviewResponse {
	items: FinanceOverviewVM[];
	total: number;
}

export function useFinanceOverview(params: FinanceOverviewFilters) {
	return useQuery<FinanceOverviewResponse>({
		queryKey: financeKeys.overview(
			params as unknown as Record<string, unknown>,
		),
		queryFn: async () => {
			const searchParams = new URLSearchParams();
			searchParams.set("page", String(params.page));
			searchParams.set("pageSize", String(params.pageSize));

			if (params.q) {
				searchParams.set("q", params.q);
			}
			if (params.gateStatus) {
				searchParams.set("gateStatus", params.gateStatus);
			}
			if (params.invoiceStatus && params.invoiceStatus.length > 0) {
				searchParams.set("invoiceStatus", params.invoiceStatus.join(","));
			}
			if (params.userType) {
				searchParams.set("userType", params.userType);
			}

			const res = await fetch(
				`/api/admin/finance/overview?${searchParams.toString()}`,
			);
			if (!res.ok) {
				throw new Error("Failed to fetch finance overview");
			}
			return res.json();
		},
	});
}
