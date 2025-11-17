import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingKeys } from "../../api/query-keys";

function useAction(action: "approve" | "reject" | "request_revision") {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (args: { id: string; comment?: string }) => {
			const res = await fetch(`/api/admin/bookings/${args.id}/action`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action, comment: args.comment }),
			});
			if (!res.ok) {
				let errorMessage = `Action failed (${res.status})`;
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
						errorMessage = `${res.statusText || "Action failed"} (${res.status})`;
					}
				} catch {
					errorMessage = `${res.statusText || "Action failed"} (${res.status})`;
				}
				throw new Error(errorMessage);
			}
			return res.json();
		},
		onSuccess: (_data, variables) => {
			qc.invalidateQueries({ queryKey: bookingKeys.all });
			qc.invalidateQueries({ queryKey: bookingKeys.adminDetail(variables.id) });
		},
	});
}

export const useApproveBooking = () => useAction("approve");
export const useRejectBooking = () => useAction("reject");
export const useRequestRevision = () => useAction("request_revision");
