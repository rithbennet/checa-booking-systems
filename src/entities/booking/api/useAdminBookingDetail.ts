import { useQuery } from "@tanstack/react-query";
import { bookingKeys } from "./query-keys";

export function useAdminBookingDetail(id: string) {
	return useQuery({
		queryKey: bookingKeys.adminDetail(id),
		queryFn: async () => {
			const res = await fetch(`/api/admin/bookings/${id}`);
			if (!res.ok) throw new Error("Failed to load booking");
			return res.json();
		},
	});
}
