"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PaymentVM } from "../model/types";
import { paymentKeys } from "./query-keys";

interface VerifyPaymentParams {
	paymentId: string;
	notes?: string;
}

interface RejectPaymentParams {
	paymentId: string;
	notes: string;
}

export function useVerifyPayment() {
	const queryClient = useQueryClient();

	return useMutation<PaymentVM, Error, VerifyPaymentParams>({
		mutationFn: async ({ paymentId, notes }) => {
			const res = await fetch(
				`/api/admin/finance/payments/${paymentId}/verify`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ notes }),
				},
			);

			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.error ?? "Failed to verify payment");
			}

			return res.json();
		},
		onSuccess: () => {
			// Invalidate both pending and history lists
			queryClient.invalidateQueries({ queryKey: paymentKeys.pending() });
			queryClient.invalidateQueries({ queryKey: paymentKeys.history() });
			// Also invalidate finance stats if they exist
			queryClient.invalidateQueries({ queryKey: ["finance", "stats"] });
		},
	});
}

export function useRejectPayment() {
	const queryClient = useQueryClient();

	return useMutation<PaymentVM, Error, RejectPaymentParams>({
		mutationFn: async ({ paymentId, notes }) => {
			const res = await fetch(
				`/api/admin/finance/payments/${paymentId}/reject`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ notes }),
				},
			);

			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.error ?? "Failed to reject payment");
			}

			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: paymentKeys.pending() });
			queryClient.invalidateQueries({ queryKey: paymentKeys.history() });
			queryClient.invalidateQueries({ queryKey: ["finance", "stats"] });
		},
	});
}
