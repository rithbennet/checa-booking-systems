"use client";

import { useQuery } from "@tanstack/react-query";
import type { UserFinancialsResponse } from "../server/user-financials-repository";
import { bookingKeys } from "./query-keys";

/**
 * Hook to fetch the current user's financial data (invoices with payment status)
 */
export function useUserFinancials() {
	return useQuery<UserFinancialsResponse>({
		queryKey: bookingKeys.userFinancials(),
		queryFn: async () => {
			const res = await fetch("/api/user/financials");
			if (!res.ok) {
				throw new Error("Failed to fetch financial data");
			}
			return res.json();
		},
	});
}
