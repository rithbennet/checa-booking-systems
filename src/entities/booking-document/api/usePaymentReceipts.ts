/**
 * Payment Receipt API Hooks
 * React Query hooks for payment receipt operations using bookingDocuments
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { payment_method_enum } from "generated/prisma";
import type { PaymentReceiptVM } from "../model/types";
import { bookingDocumentKeys } from "./query-keys";

// ==============================================================
// Query Hooks
// ==============================================================

/**
 * Fetch pending payment receipts for verification
 */
export function usePendingPaymentReceipts(params: {
	page: number;
	pageSize: number;
	q?: string;
	method?: payment_method_enum;
}) {
	const searchParams = new URLSearchParams({
		page: params.page.toString(),
		pageSize: params.pageSize.toString(),
		...(params.q && { q: params.q }),
		...(params.method && { method: params.method }),
	});

	return useQuery<{ items: PaymentReceiptVM[]; total: number }>({
		queryKey: bookingDocumentKeys.paymentReceipts("pending", params),
		queryFn: async () => {
			const res = await fetch(
				`/api/admin/finance/payments/pending?${searchParams}`,
			);
			if (!res.ok) {
				let errorDetails = "";
				try {
					const errorBody = await res.json();
					errorDetails = JSON.stringify(errorBody);
				} catch {
					try {
						errorDetails = await res.text();
					} catch {
						errorDetails = res.statusText;
					}
				}
				throw new Error(
					`Failed to fetch pending payment receipts (${res.status} ${res.statusText}): ${errorDetails}`,
				);
			}
			return res.json();
		},
	});
}

/**
 * Fetch payment receipt history (verified/rejected)
 */
export function usePaymentReceiptHistory(params: {
	page: number;
	pageSize: number;
	status?: ("verified" | "rejected")[];
	q?: string;
	method?: payment_method_enum;
	dateFrom?: string;
	dateTo?: string;
}) {
	const searchParams = new URLSearchParams({
		page: params.page.toString(),
		pageSize: params.pageSize.toString(),
		...(params.status && { status: params.status.join(",") }),
		...(params.q && { q: params.q }),
		...(params.method && { method: params.method }),
		...(params.dateFrom && { dateFrom: params.dateFrom }),
		...(params.dateTo && { dateTo: params.dateTo }),
	});

	return useQuery<{ items: PaymentReceiptVM[]; total: number }>({
		queryKey: bookingDocumentKeys.paymentReceipts("history", params),
		queryFn: async () => {
			const res = await fetch(
				`/api/admin/finance/payments/history?${searchParams}`,
			);
			if (!res.ok) {
				let errorDetails = "";
				try {
					const errorBody = await res.json();
					errorDetails = JSON.stringify(errorBody);
				} catch {
					try {
						errorDetails = await res.text();
					} catch {
						errorDetails = res.statusText;
					}
				}
				throw new Error(
					`Failed to fetch payment receipt history (${res.status} ${res.statusText}): ${errorDetails}`,
				);
			}
			return res.json();
		},
	});
}

// ==============================================================
// Mutation Hooks
// ==============================================================

/**
 * Verify a payment receipt document
 */
export function useVerifyPaymentReceipt() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (params: { documentId: string; notes?: string }) => {
			const res = await fetch(`/api/booking-docs/${params.documentId}/verify`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ notes: params.notes }),
			});
			if (!res.ok) throw new Error("Failed to verify payment receipt");
			return res.json();
		},
		onSuccess: () => {
			// Invalidate relevant queries
			queryClient.invalidateQueries({
				queryKey: bookingDocumentKeys.paymentReceipts("pending"),
			});
			queryClient.invalidateQueries({
				queryKey: bookingDocumentKeys.paymentReceipts("history"),
			});
			queryClient.invalidateQueries({
				queryKey: ["finance-stats"],
			});
		},
	});
}

/**
 * Reject a payment receipt document
 */
export function useRejectPaymentReceipt() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (params: { documentId: string; reason: string }) => {
			const res = await fetch(`/api/booking-docs/${params.documentId}/reject`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ reason: params.reason }),
			});
			if (!res.ok) throw new Error("Failed to reject payment receipt");
			return res.json();
		},
		onSuccess: () => {
			// Invalidate relevant queries
			queryClient.invalidateQueries({
				queryKey: bookingDocumentKeys.paymentReceipts("pending"),
			});
			queryClient.invalidateQueries({
				queryKey: bookingDocumentKeys.paymentReceipts("history"),
			});
			queryClient.invalidateQueries({
				queryKey: ["finance-stats"],
			});
		},
	});
}
