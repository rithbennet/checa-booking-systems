/**
 * Form Generation API Hook
 *
 * TanStack Query mutation for generating service forms
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingKeys } from "@/entities/booking/api/query-keys";
import { bookingDocumentKeys } from "@/entities/booking-document";

interface GenerateFormsResponse {
	success: boolean;
	serviceForm: {
		id: string;
		formNumber: string;
		serviceFormUrl: string;
		workingAreaFormUrl: string | null;
		validUntil: string;
	};
}

interface GenerateFormsError {
	error: string;
	formId?: string;
	formNumber?: string;
}

async function generateForms(
	bookingId: string,
): Promise<GenerateFormsResponse> {
	const response = await fetch(`/api/admin/forms/generate/${bookingId}`, {
		method: "POST",
	});

	if (!response.ok) {
		const data = (await response.json()) as GenerateFormsError;
		throw new Error(data.error ?? "Failed to generate forms");
	}

	return response.json() as Promise<GenerateFormsResponse>;
}

export function useGenerateForms() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: generateForms,
		onSuccess: async (_data, bookingId) => {
			// Invalidate booking queries to refresh data
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: bookingKeys.detail(bookingId),
				}),
				queryClient.invalidateQueries({
					queryKey: bookingKeys.adminDetail(bookingId),
				}),
				queryClient.invalidateQueries({
					queryKey: bookingKeys.commandCenter(bookingId),
				}),
				queryClient.invalidateQueries({
					queryKey: bookingDocumentKeys.byBooking(bookingId),
				}),
			]);
		},
	});
}
