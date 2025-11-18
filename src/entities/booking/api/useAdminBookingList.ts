import { useQuery } from "@tanstack/react-query";
import { bookingKeys } from "./query-keys";

export function useAdminBookingList(params: {
	status?: string[];
	query?: string;
	page?: number;
	pageSize?: number;
}) {
	return useQuery({
		queryKey: bookingKeys.adminList(params),
		queryFn: async () => {
			const searchParams = new URLSearchParams({
				...(params.query ? { query: params.query } : {}),
				...(params.status?.length ? { status: params.status.join(",") } : {}),
				page: String(params.page ?? 1),
				pageSize: String(params.pageSize ?? 25),
			});

			const res = await fetch(`/api/admin/bookings?${searchParams}`);
			if (!res.ok) throw new Error("Failed to load bookings");
			return res.json();
		},
		staleTime: 10_000,
	});
}
