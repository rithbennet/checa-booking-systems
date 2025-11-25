/**
 * Sample Modification Mutations
 * Hooks for creating and approving/rejecting modifications
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bookingKeys } from "@/entities/booking/api/query-keys";
import type {
	CreateModificationInput,
	SampleModificationVM,
} from "./modification-types";

async function createModification(
	input: CreateModificationInput,
): Promise<SampleModificationVM> {
	const res = await fetch("/api/admin/modifications", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});

	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		throw new Error(error.error || "Failed to create modification");
	}

	return res.json();
}

async function approveModification(params: {
	modificationId: string;
	approved: boolean;
	notes?: string;
}): Promise<SampleModificationVM> {
	const res = await fetch(`/api/admin/modifications/${params.modificationId}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			approved: params.approved,
			notes: params.notes,
		}),
	});

	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		throw new Error(error.error || "Failed to process modification");
	}

	return res.json();
}

export function useCreateModification() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createModification,
		onSuccess: () => {
			// Invalidate booking queries to refresh data
			queryClient.invalidateQueries({ queryKey: bookingKeys.all });
			toast.success("Modification request created", {
				description: "Customer will be notified for approval",
			});
		},
		onError: (error: Error) => {
			toast.error("Failed to create modification", {
				description: error.message,
			});
		},
	});
}

export function useApproveModification() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: approveModification,
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: bookingKeys.all });
			toast.success(
				variables.approved ? "Modification approved" : "Modification rejected",
				{
					description: variables.approved
						? "The booking has been updated"
						: "The modification request was rejected",
				},
			);
		},
		onError: (error: Error) => {
			toast.error("Failed to process modification", {
				description: error.message,
			});
		},
	});
}
