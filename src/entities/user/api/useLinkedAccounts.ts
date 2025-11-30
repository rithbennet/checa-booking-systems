import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/shared/server/better-auth/client";
import { userKeys } from "./query-keys";

export interface LinkedAccount {
	id: string;
	provider: string;
	accountId: string;
	linkedAt: string;
}

/**
 * Hook to fetch linked accounts for the current user
 */
export function useLinkedAccounts() {
	return useQuery<LinkedAccount[]>({
		queryKey: userKeys.linkedAccounts(),
		queryFn: async () => {
			const res = await fetch("/api/user/linked-accounts");
			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.error || "Failed to fetch linked accounts");
			}
			const data = await res.json();
			return data.accounts;
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
}

/**
 * Hook to link a social account (Google) to the current user
 */
export function useLinkSocialAccount() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (provider: string) => {
			await authClient.linkSocial({
				provider: provider as "google",
				callbackURL: "/profile?linked=success",
			});
		},
		onSuccess: () => {
			// Invalidate linked accounts cache after linking
			queryClient.invalidateQueries({ queryKey: userKeys.linkedAccounts() });
		},
	});
}

/**
 * Hook to unlink a social account from the current user
 */
export function useUnlinkAccount() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (providerId: string) => {
			await authClient.unlinkAccount({
				providerId,
			});
		},
		onSuccess: () => {
			// Invalidate linked accounts cache after unlinking
			queryClient.invalidateQueries({ queryKey: userKeys.linkedAccounts() });
		},
	});
}
