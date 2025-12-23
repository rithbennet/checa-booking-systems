/**
 * Document Config React Query Hooks
 * Client-side hooks for fetching and updating document configuration
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentConfigSchema } from "../model/schema";
import type { DocumentConfig, UpdateDocumentConfigInput } from "../model/types";
import { documentConfigKeys } from "./query-keys";

/**
 * Parse and validate document config JSON response.
 * Throws a normalized error if validation fails.
 *
 * @param json - The raw JSON response to validate
 * @returns The validated DocumentConfig
 */
function parseDocumentConfig(json: unknown): DocumentConfig {
	try {
		return documentConfigSchema.parse(json);
	} catch (parseError) {
		const message =
			parseError instanceof Error
				? parseError.message
				: "Unknown validation error";
		throw new Error(`Invalid document config response: ${message}`);
	}
}

/**
 * Fetch global document configuration
 */
export function useDocumentConfig() {
	return useQuery({
		queryKey: documentConfigKeys.global(),
		queryFn: async (): Promise<DocumentConfig> => {
			const response = await fetch("/api/admin/settings/document-config");
			if (!response.ok) {
				throw new Error("Failed to fetch document config");
			}
			const json = await response.json();
			return parseDocumentConfig(json);
		},
	});
}

/**
 * Update global document configuration
 */
export function useUpdateDocumentConfig() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			data: UpdateDocumentConfigInput,
		): Promise<DocumentConfig> => {
			const response = await fetch("/api/admin/settings/document-config", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				let errorMessage = "Failed to update document config";
				try {
					const error = await response.json();
					errorMessage = error.error || errorMessage;
				} catch {
					// Response is not JSON, use status text as fallback
					errorMessage = `${response.status}: ${response.statusText || errorMessage}`;
				}
				throw new Error(errorMessage);
			}

			const json = await response.json();
			return parseDocumentConfig(json);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: documentConfigKeys.global(),
			});
		},
	});
}
