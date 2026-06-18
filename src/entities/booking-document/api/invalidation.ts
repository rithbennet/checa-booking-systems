import type { QueryClient } from "@tanstack/react-query";
import { bookingKeys } from "@/entities/booking/api/query-keys";
import { bookingDocumentKeys } from "./query-keys";

export function invalidateDocumentVerificationWorkflow(
	queryClient: QueryClient,
	bookingId?: string,
) {
	queryClient.invalidateQueries({ queryKey: bookingDocumentKeys.all });
	queryClient.invalidateQueries({ queryKey: bookingKeys.all });
	queryClient.invalidateQueries({ queryKey: ["finance-stats"] });

	if (bookingId) {
		queryClient.invalidateQueries({
			queryKey: bookingDocumentKeys.byBooking(bookingId),
		});
	}
}
