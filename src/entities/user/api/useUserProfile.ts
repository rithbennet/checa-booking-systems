import { useQuery } from "@tanstack/react-query";
import type { UserProfileVM } from "../server/profile-repository";
import { userKeys } from "./query-keys";

/**
 * Hook to get current user's profile
 */
export function useUserProfile() {
	return useQuery<UserProfileVM>({
		queryKey: userKeys.profile(),
		queryFn: async () => {
			const res = await fetch("/api/user/profile");
			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.error || "Failed to fetch profile");
			}
			return res.json();
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
}
