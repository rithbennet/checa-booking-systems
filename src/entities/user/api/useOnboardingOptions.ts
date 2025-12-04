import { useQuery } from "@tanstack/react-query";
import type { OnboardingOptionsVM } from "../server/onboarding-options-repository";
import { userKeys } from "./query-keys";

/**
 * Hook to fetch onboarding dropdown options
 */
export function useOnboardingOptions() {
	return useQuery<OnboardingOptionsVM>({
		queryKey: userKeys.onboardingOptions(),
		queryFn: async () => {
			const res = await fetch("/api/auth/onboarding-options");
			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.error || "Failed to fetch onboarding options");
			}
			return res.json();
		},
		staleTime: 10 * 60 * 1000, // 10 minutes - this data doesn't change often
	});
}
