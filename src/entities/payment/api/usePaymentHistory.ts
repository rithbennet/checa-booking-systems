"use client";

import { useQuery } from "@tanstack/react-query";
import type {
	payment_method_enum,
	payment_status_enum,
} from "generated/prisma";
import type { PaymentHistoryResponse } from "../model/types";
import { paymentKeys } from "./query-keys";

interface UsePaymentHistoryParams {
	status?: payment_status_enum[];
	method?: payment_method_enum;
	verifierId?: string;
	dateFrom?: string;
	dateTo?: string;
	q?: string;
	page: number;
	pageSize: number;
}

export function usePaymentHistory(params: UsePaymentHistoryParams) {
	return useQuery<PaymentHistoryResponse>({
		queryKey: paymentKeys.history(params),
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
			if (params.status && params.status.length > 0) {
				searchParams.set("status", params.status.join(","));
			}
			if (params.verifierId) {
				searchParams.set("verifierId", params.verifierId);
			}
			if (params.dateFrom) {
				searchParams.set("dateFrom", params.dateFrom);
			}
			if (params.dateTo) {
				searchParams.set("dateTo", params.dateTo);
			}

			const res = await fetch(
				`/api/admin/finance/payments/history?${searchParams.toString()}`,
			);
			if (!res.ok) {
				throw new Error("Failed to fetch payment history");
			}
			return res.json();
		},
	});
}
