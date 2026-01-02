import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bookingKeys } from "@/entities/booking/api/query-keys";
import { bookingDocumentKeys } from "@/entities/booking-document";

export function useRegenerateForm(bookingId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (formId: string) => {
			const res = await fetch(`/api/admin/forms/${formId}/regenerate`, {
				method: "POST",
			});
			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.error || "Failed to regenerate form");
			}
			return res.json();
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: bookingKeys.all });
			queryClient.invalidateQueries({
				queryKey: bookingDocumentKeys.byBooking(bookingId),
			});
			toast.success("Form regenerated successfully", {
				description: `New form number: ${data.serviceForm.formNumber}`,
			});
		},
		onError: (error) => {
			toast.error("Failed to regenerate form", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		},
	});
}
