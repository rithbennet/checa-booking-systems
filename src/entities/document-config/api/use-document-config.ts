/**
 * Document Config React Query Hooks
 * Client-side hooks for fetching and updating document configuration
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentConfigKeys } from "./query-keys";

/**
 * Fetch global document configuration
 */
export function useDocumentConfig() {
	return useQuery({
		queryKey: documentConfigKeys.global(),
		queryFn: async () => {
			const response = await fetch("/api/admin/settings/document-config");
			if (!response.ok) {
				throw new Error("Failed to fetch document config");
			}
			return response.json();
		},
	});
}

/**
 * Update global document configuration
 */
export function useUpdateDocumentConfig() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: unknown) => {
			const response = await fetch("/api/admin/settings/document-config", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to update document config");
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: documentConfigKeys.global(),
			});
		},
	});
}
