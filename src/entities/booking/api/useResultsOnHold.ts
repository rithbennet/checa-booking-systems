"use client";

import { useQuery } from "@tanstack/react-query";
import type { ResultsOnHoldVM } from "../server/finance-repository";
import { financeKeys } from "./useFinanceStats";

interface ResultsOnHoldResponse {
	items: ResultsOnHoldVM[];
	total: number;
}

interface UseResultsOnHoldParams {
	q?: string;
	page: number;
	pageSize: number;
}

export function useResultsOnHold(params: UseResultsOnHoldParams) {
	return useQuery<ResultsOnHoldResponse>({
		queryKey: financeKeys.resultsOnHold(
			params as unknown as Record<string, unknown>,
		),
		queryFn: async () => {
			const searchParams = new URLSearchParams();
			searchParams.set("page", String(params.page));
			searchParams.set("pageSize", String(params.pageSize));

			if (params.q) {
				searchParams.set("q", params.q);
			}

			const res = await fetch(
				`/api/admin/finance/results-on-hold?${searchParams.toString()}`,
			);
			if (!res.ok) {
				throw new Error("Failed to fetch results on hold");
			}
			return res.json();
		},
	});
}
