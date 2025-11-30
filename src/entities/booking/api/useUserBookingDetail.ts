/**
 * useUserBookingDetail Hook
 *
 * Fetches user's own booking data for the detail view.
 */

import { useQuery } from "@tanstack/react-query";
import type { UserBookingDetailVM } from "../model/user-detail-types";
import { bookingKeys } from "./query-keys";

export function useUserBookingDetail(id: string) {
	return useQuery<UserBookingDetailVM>({
		queryKey: bookingKeys.userDetail(id),
		queryFn: async () => {
			const res = await fetch(`/api/bookings/${id}/details`);
			if (!res.ok) {
				if (res.status === 404) {
					throw new Error("Booking not found");
				}
				throw new Error("Failed to load booking");
			}
			return res.json();
		},
		enabled: Boolean(id),
	});
}
