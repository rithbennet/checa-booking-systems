/**
 * Sample Status Update Mutation
 * Optimistic update with rollback on error
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { sampleTrackingKeys } from "@/entities/sample-tracking/model/query-keys";
import type { SampleStatus } from "@/entities/sample-tracking/model/types";

async function updateSampleStatus(
	sampleId: string,
	status: SampleStatus,
): Promise<{ id: string; status: SampleStatus }> {
	const res = await fetch(`/api/admin/samples/${sampleId}/status`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ status }),
	});

	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		throw new Error(error.error || "Failed to update sample status");
	}

	return res.json();
}

export function useUpdateSampleStatus() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			sampleId,
			status,
		}: {
			sampleId: string;
			status: SampleStatus;
		}) => updateSampleStatus(sampleId, status),
		onMutate: async ({ sampleId, status }) => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({
				queryKey: sampleTrackingKeys.all,
			});

			// Snapshot previous values for rollback
			const previousQueries = new Map();

			// Optimistically update all sample queries
			queryClient.setQueriesData(
				{ queryKey: sampleTrackingKeys.all },
				(old: unknown) => {
					if (!old || typeof old !== "object") return old;
					if ("items" in old && Array.isArray(old.items)) {
						return {
							...old,
							items: (old.items as Array<{ id: string; status: string }>).map(
								(item) => (item.id === sampleId ? { ...item, status } : item),
							),
						};
					}
					return old;
				},
			);

			return { previousQueries };
		},
		onError: (error, _variables, context) => {
			// Rollback on error
			if (context?.previousQueries) {
				context.previousQueries.forEach((data, key) => {
					queryClient.setQueryData(key, data);
				});
			}

			toast.error("Failed to update status", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		},
		onSuccess: (_data, variables) => {
			// Invalidate queries to refetch fresh data
			queryClient.invalidateQueries({
				queryKey: sampleTrackingKeys.operationsList({}),
			});
			queryClient.invalidateQueries({
				queryKey: sampleTrackingKeys.userActive(""),
			});

			toast.success("Status updated", {
				description: `Sample status changed to ${variables.status}`,
			});
		},
	});
}
