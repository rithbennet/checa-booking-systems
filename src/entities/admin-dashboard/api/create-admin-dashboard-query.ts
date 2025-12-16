import { type UseQueryOptions, useQuery } from "@tanstack/react-query";

interface CreateAdminDashboardQueryOptions<T> {
	endpoint: string;
	queryKey: readonly unknown[];
	errorMessage: string;
	staleTime?: number;
	refetchOnWindowFocus?: boolean;
}

export function createAdminDashboardQuery<T>({
	endpoint,
	queryKey,
	errorMessage,
	staleTime = 5 * 60_000,
	refetchOnWindowFocus = false,
}: CreateAdminDashboardQueryOptions<T>) {
	async function fetchData(): Promise<T> {
		const res = await fetch(endpoint, {
			method: "GET",
			credentials: "same-origin",
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(err.error || errorMessage);
		}
		return res.json();
	}

	return function useQueryHook(
		options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">,
	) {
		return useQuery<T>({
			queryKey,
			queryFn: fetchData,
			staleTime,
			refetchOnWindowFocus,
			...options,
		});
	};
}
