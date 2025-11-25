/**
 * useBookingCommandCenter Hook
 *
 * Fetches comprehensive booking data for the admin command center view.
 * This hook is used by the admin booking details page.
 */

import { useQuery } from "@tanstack/react-query";
import type { BookingCommandCenterVM } from "../model/command-center-types";
import { bookingKeys } from "./query-keys";

export function useBookingCommandCenter(id: string) {
	return useQuery<BookingCommandCenterVM>({
		queryKey: bookingKeys.commandCenter(id),
		queryFn: async () => {
			const res = await fetch(`/api/admin/bookings/${id}/details`);
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
