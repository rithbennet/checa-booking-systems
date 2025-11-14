/**
 * Booking entity API hooks using TanStack Query
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateBookingInput } from "../model/schemas";
import type { BookingRequest } from "../model/types";

export const bookingKeys = {
	all: ["bookings"] as const,
	lists: () => [...bookingKeys.all, "list"] as const,
	list: (filters?: { status?: string; userId?: string }) =>
		[...bookingKeys.lists(), filters] as const,
	details: () => [...bookingKeys.all, "detail"] as const,
	detail: (id: string) => [...bookingKeys.details(), id] as const,
	drafts: () => [...bookingKeys.all, "drafts"] as const,
};

/**
 * Create a new draft booking (no data required)
 */
async function createBookingDraft(): Promise<{
	id: string;
	referenceNumber: string;
	status: string;
}> {
	const response = await fetch("/api/bookings", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || "Failed to create booking draft");
	}

	return response.json();
}

/**
 * Save booking draft with partial or full data
 */
async function saveBookingDraft(
	bookingId: string,
	data: Partial<CreateBookingInput>,
): Promise<{ lastSavedAt: string }> {
	const response = await fetch(`/api/bookings/${bookingId}`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || "Failed to save booking draft");
	}

	return response.json();
}

/**
 * Submit booking for approval
 */
async function submitBooking(bookingId: string): Promise<{
	id: string;
	status: string;
	message?: string;
}> {
	const response = await fetch(`/api/bookings/${bookingId}/submit`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || "Failed to submit booking");
	}

	return response.json();
}

/**
 * Delete booking draft
 */
async function deleteBookingDraft(bookingId: string): Promise<void> {
	const response = await fetch(`/api/bookings/${bookingId}`, {
		method: "DELETE",
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || "Failed to delete booking draft");
	}
}

/**
 * Create a new booking request (legacy - for full submission)
 */
async function createBookingRequest(
	input: CreateBookingInput,
): Promise<{ id: string; referenceNumber: string; status: string }> {
	const draft = await createBookingDraft();
	await saveBookingDraft(draft.id, input);
	const result = await submitBooking(draft.id);
	return {
		...result,
		referenceNumber: draft.referenceNumber,
	};
}

/**
 * Get booking by ID
 */
async function getBooking(id: string): Promise<BookingRequest | null> {
	const response = await fetch(`/api/bookings/${id}`);
	if (!response.ok) {
		if (response.status === 404) return null;
		throw new Error("Failed to fetch booking");
	}
	return response.json();
}

/**
 * Get user's bookings
 */
async function getUserBookings(filters?: {
	status?: string;
}): Promise<BookingRequest[]> {
	const params = new URLSearchParams();
	if (filters?.status) {
		params.set("status", filters.status);
	}

	const response = await fetch(`/api/bookings?${params.toString()}`);
	if (!response.ok) {
		throw new Error("Failed to fetch bookings");
	}
	return response.json();
}

/**
 * Save booking as draft (localStorage for now, can be enhanced with API)
 */
function saveDraftToLocalStorage(draft: Partial<CreateBookingInput>): void {
	localStorage.setItem("booking_draft", JSON.stringify(draft));
}

/**
 * Load draft from localStorage
 */
function loadDraftFromLocalStorage(): Partial<CreateBookingInput> | null {
	const draft = localStorage.getItem("booking_draft");
	if (!draft) return null;
	try {
		return JSON.parse(draft);
	} catch {
		return null;
	}
}

/**
 * Clear draft from localStorage
 */
function clearDraftFromLocalStorage(): void {
	localStorage.removeItem("booking_draft");
}

/**
 * Hook to create a booking request
 */
export function useCreateBooking() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createBookingRequest,
		onSuccess: () => {
			// Invalidate bookings list
			queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
			// Clear draft
			clearDraftFromLocalStorage();
		},
	});
}

/**
 * Hook to create a booking draft
 */
export function useCreateBookingDraft() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createBookingDraft,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
		},
	});
}

/**
 * Hook to save booking draft
 */
export function useSaveBookingDraft() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			bookingId,
			data,
		}: {
			bookingId: string;
			data: Partial<CreateBookingInput>;
		}) => saveBookingDraft(bookingId, data),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: bookingKeys.detail(variables.bookingId),
			});
		},
	});
}

/**
 * Hook to submit booking
 */
export function useSubmitBooking() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: submitBooking,
		onSuccess: (_data, bookingId) => {
			queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: bookingKeys.detail(bookingId),
			});
			clearDraftFromLocalStorage();
		},
	});
}

/**
 * Hook to delete booking draft
 */
export function useDeleteBookingDraft() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteBookingDraft,
		onSuccess: (_data, bookingId) => {
			queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
			queryClient.removeQueries({ queryKey: bookingKeys.detail(bookingId) });
			clearDraftFromLocalStorage();
		},
	});
}

/**
 * Hook to get a booking by ID
 */
export function useBooking(id: string | null | undefined) {
	return useQuery({
		queryKey: bookingKeys.detail(id ?? ""),
		queryFn: () => {
			if (!id) return null;
			return getBooking(id);
		},
		enabled: !!id,
	});
}

/**
 * Hook to get user's bookings
 */
export function useUserBookings(filters?: { status?: string }) {
	return useQuery({
		queryKey: bookingKeys.list(filters),
		queryFn: () => getUserBookings(filters),
	});
}

/**
 * Hook to save draft
 */
export function useSaveDraft() {
	return {
		save: saveDraftToLocalStorage,
		load: loadDraftFromLocalStorage,
		clear: clearDraftFromLocalStorage,
	};
}
