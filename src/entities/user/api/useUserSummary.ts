import { useQuery } from "@tanstack/react-query";
import type { UserSummaryVM } from "../model/types";
import { userKeys } from "./query-keys";

/**
 * TanStack Query hook to fetch user summary data for admin view
 * @param userId - The user ID to fetch summary for
 */
export function useUserSummary(userId: string) {
	return useQuery<UserSummaryVM>({
		queryKey: userKeys.summary(userId),
		queryFn: async () => {
			const res = await fetch(`/api/admin/users/${userId}/summary`);
			if (!res.ok) {
				throw new Error("Failed to load user summary");
			}
			return res.json();
		},
		enabled: Boolean(userId),
	});
}
