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
			if (!res.ok) {
				let errorMessage = `Bulk action failed (${res.status})`;
				try {
					const text = await res.text();
					if (text) {
						try {
							const json = JSON.parse(text);
							const message = json.error || json.message || text;
							errorMessage = `${message} (${res.status})`;
						} catch {
							errorMessage = `${text} (${res.status})`;
						}
					} else {
						errorMessage = `${res.statusText || "Bulk action failed"} (${res.status})`;
					}
				} catch {
					errorMessage = `${res.statusText || "Bulk action failed"} (${res.status})`;
				}
				throw new Error(errorMessage);
			}
			return res.json();
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: bookingKeys.all });
		},
	});
}
