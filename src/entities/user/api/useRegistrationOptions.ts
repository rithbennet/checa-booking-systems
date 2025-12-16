import { useQuery } from "@tanstack/react-query";
import type { OnboardingOptionsVM } from "../server/onboarding-options-repository";
import { userKeys } from "./query-keys";

/**
 * Hook to fetch registration dropdown options (public, no auth required)
 */
export function useRegistrationOptions() {
	return useQuery<OnboardingOptionsVM>({
		queryKey: userKeys.registrationOptions(),
		queryFn: async () => {
			const res = await fetch("/api/auth/registration-options");
			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.error || "Failed to fetch registration options");
			}
			return res.json();
		},
		staleTime: 10 * 60 * 1000, // 10 minutes - this data doesn't change often
	});
}

