"use client";

import { useQuery } from "@tanstack/react-query";
import type { invoice_status_enum } from "generated/prisma";
import type { InvoiceListVM } from "../server/repository";

export const invoiceKeys = {
	all: ["invoices"] as const,
	list: (params: Record<string, unknown>) =>
		[...invoiceKeys.all, "list", params] as const,
	detail: (id: string) => [...invoiceKeys.all, "detail", id] as const,
};

interface InvoiceListResponse {
	items: InvoiceListVM[];
	total: number;
}

interface UseInvoiceListParams {
	status?: invoice_status_enum[];
	bookingId?: string;
	serviceFormId?: string;
	dueDateFrom?: string;
	dueDateTo?: string;
	q?: string;
	page: number;
	pageSize: number;
}

export function useInvoiceList(params: UseInvoiceListParams) {
	return useQuery<InvoiceListResponse>({
		queryKey: invoiceKeys.list(params as unknown as Record<string, unknown>),
		queryFn: async () => {
			const searchParams = new URLSearchParams();
			searchParams.set("page", String(params.page));
			searchParams.set("pageSize", String(params.pageSize));

			if (params.q) {
				searchParams.set("q", params.q);
			}
			if (params.status && params.status.length > 0) {
				searchParams.set("status", params.status.join(","));
			}
			if (params.bookingId) {
				searchParams.set("bookingId", params.bookingId);
			}
			if (params.serviceFormId) {
				searchParams.set("serviceFormId", params.serviceFormId);
			}
			if (params.dueDateFrom) {
				searchParams.set("dueDateFrom", params.dueDateFrom);
			}
			if (params.dueDateTo) {
				searchParams.set("dueDateTo", params.dueDateTo);
			}

			const res = await fetch(
				`/api/admin/finance/invoices?${searchParams.toString()}`,
			);
			if (!res.ok) {
				throw new Error("Failed to fetch invoices");
			}
			return res.json();
		},
	});
}
