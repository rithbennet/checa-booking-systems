import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
	UpdateProfileInput,
	UserProfileVM,
} from "../server/profile-repository";
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

/**
 * Hook to update current user's profile
 */
export function useUpdateProfile() {
	const queryClient = useQueryClient();

	return useMutation<UserProfileVM, Error, UpdateProfileInput>({
		mutationFn: async (input) => {
			const res = await fetch("/api/user/profile", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			});
			if (!res.ok) {
				const error = (await res.json().catch(() => ({}))) as {
					error?: string;
				};
				throw new Error(error.error || "Failed to update profile");
			}
			return res.json();
		},
		onSuccess: () => {
			// Invalidate the profile query to refetch
			queryClient.invalidateQueries({ queryKey: userKeys.profile() });
		},
	});
}
