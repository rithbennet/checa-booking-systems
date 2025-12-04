/**
 * useDocumentVerification Hook
 *
 * TanStack Query hooks for document verification state and download eligibility.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
	DocumentVerificationStateVM,
	DownloadEligibilityVM,
} from "../model/types";
import { bookingDocumentKeys } from "./query-keys";

/**
 * Fetch document verification state for a booking
 */
export function useDocumentVerificationState(bookingId: string) {
	return useQuery<DocumentVerificationStateVM>({
		queryKey: bookingDocumentKeys.verificationState(bookingId),
		queryFn: async () => {
			const res = await fetch(`/api/bookings/${bookingId}/verification-state`);
			if (!res.ok) {
				throw new Error("Failed to load verification state");
			}
			return res.json();
		},
		enabled: Boolean(bookingId),
	});
}

/**
 * Fetch download eligibility for a booking
 */
export function useDownloadEligibility(bookingId: string) {
	return useQuery<DownloadEligibilityVM>({
		queryKey: bookingDocumentKeys.downloadEligibility(bookingId),
		queryFn: async () => {
			const res = await fetch(
				`/api/bookings/${bookingId}/download-eligibility`,
			);
			if (!res.ok) {
				throw new Error("Failed to check download eligibility");
			}
			return res.json();
		},
		enabled: Boolean(bookingId),
	});
}

/**
 * Verify a document mutation
 */
export function useVerifyDocument() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			documentId,
			notes,
			paymentMethod,
			amount,
		}: {
			documentId: string;
			notes?: string;
			paymentMethod?: string;
			amount?: string;
		}) => {
			const res = await fetch(`/api/booking-docs/${documentId}/verify`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ notes, paymentMethod, amount }),
			});
			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.message || "Failed to verify document");
			}
			return res.json();
		},
		onSuccess: () => {
			// Invalidate all document-related queries
			queryClient.invalidateQueries({ queryKey: bookingDocumentKeys.all });
		},
	});
}

/**
 * Reject a document mutation
 */
export function useRejectDocument() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			documentId,
			reason,
		}: {
			documentId: string;
			reason: string;
		}) => {
			const res = await fetch(`/api/booking-docs/${documentId}/reject`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ reason }),
			});
			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.message || "Failed to reject document");
			}
			return res.json();
		},
		onSuccess: () => {
			// Invalidate all document-related queries
			queryClient.invalidateQueries({ queryKey: bookingDocumentKeys.all });
		},
	});
}
