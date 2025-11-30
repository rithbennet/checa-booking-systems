"use client";

import { useQuery } from "@tanstack/react-query";
import type { payment_method_enum } from "generated/prisma";
import type { PendingPaymentsResponse } from "../model/types";
import { paymentKeys } from "./query-keys";

interface UsePendingPaymentsParams {
	q?: string;
	method?: payment_method_enum;
	page: number;
	pageSize: number;
}

export function usePendingPayments(params: UsePendingPaymentsParams) {
	return useQuery<PendingPaymentsResponse>({
		queryKey: paymentKeys.pending(params),
		queryFn: async () => {
			const searchParams = new URLSearchParams();
			searchParams.set("page", String(params.page));
			searchParams.set("pageSize", String(params.pageSize));

			if (params.q) {
				searchParams.set("q", params.q);
			}
			if (params.method) {
				searchParams.set("method", params.method);
			}

			const res = await fetch(
				`/api/admin/finance/payments/pending?${searchParams.toString()}`,
			);
			if (!res.ok) {
				throw new Error("Failed to fetch pending payments");
			}
			return res.json();
		},
	});
}
