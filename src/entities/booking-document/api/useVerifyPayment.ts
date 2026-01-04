import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bookingKeys } from "@/entities/booking/api/query-keys";
import { bookingDocumentKeys } from "./query-keys";

interface VerifyPaymentParams {
	documentId: string;
	bookingId: string;
	notes?: string;
}

export function useVerifyPayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ documentId, notes }: VerifyPaymentParams) => {
			const res = await fetch(`/api/booking-docs/${documentId}/verify`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ notes }),
			});
			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.error || "Failed to verify payment");
			}
			return res.json();
		},
		onSuccess: (_data, variables) => {
			toast.success("Payment verified successfully");
			queryClient.invalidateQueries({ queryKey: bookingKeys.all });
			queryClient.invalidateQueries({
				queryKey: bookingDocumentKeys.byBooking(variables.bookingId),
			});
		},
		onError: (error) => {
			toast.error("Failed to verify payment", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		},
	});
}
