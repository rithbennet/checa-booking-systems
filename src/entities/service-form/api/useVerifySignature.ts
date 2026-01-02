import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bookingKeys } from "@/entities/booking/api/query-keys";

export function useVerifySignature() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (formId: string) => {
			const res = await fetch(`/api/admin/forms/${formId}/verify-signature`, {
				method: "POST",
			});
			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.error || "Failed to verify signature");
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: bookingKeys.all });
			toast.success("Signature verified", {
				description: "You can now verify payments for this booking",
			});
		},
		onError: (error) => {
			toast.error("Failed to verify signature", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		},
	});
}
