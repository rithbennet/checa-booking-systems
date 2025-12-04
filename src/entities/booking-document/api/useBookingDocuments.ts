/**
 * useBookingDocuments Hook
 *
 * TanStack Query hook to fetch booking documents for a booking.
 */

import { useQuery } from "@tanstack/react-query";
import type { BookingDocumentVM } from "../model/types";
import { bookingDocumentKeys } from "./query-keys";

export function useBookingDocuments(bookingId: string) {
	return useQuery<BookingDocumentVM[]>({
		queryKey: bookingDocumentKeys.byBooking(bookingId),
		queryFn: async () => {
			const res = await fetch(`/api/bookings/${bookingId}/documents`);
			if (!res.ok) {
				throw new Error("Failed to load booking documents");
			}
			return res.json();
		},
		enabled: Boolean(bookingId),
	});
}
