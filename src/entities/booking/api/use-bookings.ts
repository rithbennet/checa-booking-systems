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
 * Create a new booking request
 */
async function createBookingRequest(
	input: CreateBookingInput,
): Promise<{ id: string; referenceNumber: string; status: string }> {
	const response = await fetch("/api/bookings", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(input),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || "Failed to create booking");
	}

	return response.json();
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
