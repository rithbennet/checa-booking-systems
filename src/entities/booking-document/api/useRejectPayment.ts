import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bookingKeys } from "@/entities/booking/api/query-keys";
import { bookingDocumentKeys } from "./query-keys";

interface RejectPaymentParams {
	documentId: string;
	bookingId: string;
	notes: string;
}

export function useRejectPayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ documentId, notes }: RejectPaymentParams) => {
			if (!notes.trim()) {
				throw new Error("Please provide rejection notes");
			}
			const res = await fetch(`/api/booking-docs/${documentId}/reject`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ notes }),
			});
			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.error || "Failed to reject payment");
			}
			return res.json();
		},
		onSuccess: (_data, variables) => {
			toast.success("Payment rejected");
			queryClient.invalidateQueries({ queryKey: bookingKeys.all });
			queryClient.invalidateQueries({
				queryKey: bookingDocumentKeys.byBooking(variables.bookingId),
			});
		},
		onError: (error) => {
			toast.error("Failed to reject payment", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		},
	});
}
