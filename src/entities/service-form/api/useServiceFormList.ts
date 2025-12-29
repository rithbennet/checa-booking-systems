"use client";

import { useQuery } from "@tanstack/react-query";
import type { form_status_enum } from "generated/prisma";
import type { ServiceFormListVM } from "../model/types";

export const serviceFormKeys = {
	all: ["serviceForms"] as const,
	list: (params: Record<string, unknown>) =>
		[...serviceFormKeys.all, "list", params] as const,
	forReview: (params: Record<string, unknown>) =>
		[...serviceFormKeys.all, "forReview", params] as const,
	detail: (id: string) => [...serviceFormKeys.all, "detail", id] as const,
};

interface ServiceFormListResponse {
	items: ServiceFormListVM[];
	total: number;
}

interface UseServiceFormListParams {
	status?: form_status_enum[];
	bookingId?: string;
	q?: string;
	page: number;
	pageSize: number;
}

export function useServiceFormList(params: UseServiceFormListParams) {
	return useQuery<ServiceFormListResponse>({
		queryKey: serviceFormKeys.list(
			params as unknown as Record<string, unknown>,
		),
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

			const res = await fetch(
				`/api/admin/finance/forms?${searchParams.toString()}`,
			);
			if (!res.ok) {
				throw new Error("Failed to fetch service forms");
			}
			return res.json();
		},
	});
}

export function useFormsForReview(params: {
	q?: string;
	page: number;
	pageSize: number;
}) {
	return useServiceFormList({
		...params,
		status: ["signed_forms_uploaded"],
	});
}
