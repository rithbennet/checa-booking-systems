import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingKeys } from "../../api/query-keys";

export function useBulkAction() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (args: {
			action: "approve" | "reject" | "request_revision" | "delete";
			ids: string[];
			comment?: string;
		}) => {
			const res = await fetch("/api/admin/bookings/bulk-action", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(args),
			});
			if (!res.ok) throw new Error("Bulk action failed");
			return res.json();
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: bookingKeys.all });
		},
	});
}
