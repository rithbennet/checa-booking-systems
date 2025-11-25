/**
 * Booking entity API hooks using TanStack Query
 * Following Feature-Sliced Design patterns
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateBookingInput } from "../model/schemas";
import type { BookingRequest } from "../model/types";
import { bookingsListKeys } from "./use-bookings-list";

export const bookingKeys = {
	all: ["bookings"] as const,
	details: () => [...bookingKeys.all, "detail"] as const,
	detail: (id: string) => [...bookingKeys.details(), id] as const,
};

/**
 * Invalidate all booking-related queries
 * Call this after any mutation that affects the bookings list
 * Export this for use in other components that might do manual mutations
 */
export function invalidateAllBookingQueries(
	queryClient: ReturnType<typeof useQueryClient>,
) {
	// Invalidate list keys (includes counts and pagination)
	queryClient.invalidateQueries({ queryKey: bookingsListKeys.root });
	// Invalidate counts separately since they have a different root
	queryClient.invalidateQueries({ queryKey: bookingsListKeys.countsRoot });
}

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
 * Bulk delete booking drafts
 */
async function bulkDeleteBookingDrafts(bookingIds: string[]): Promise<{
	success: boolean;
	deleted: number;
	failed: number;
	total: number;
}> {
	const response = await fetch("/api/bookings/bulk-delete", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ bookingIds }),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || "Failed to bulk delete bookings");
	}

	return response.json();
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
 * Hook to create a booking request (legacy - combines create + save + submit)
 * @deprecated Use useCreateBookingDraft + useSaveBookingDraft + useSubmitBooking instead
 */
export function useCreateBooking() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createBookingRequest,
		onSuccess: () => {
			// Invalidate all booking lists and counts
			invalidateAllBookingQueries(queryClient);
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
			// Invalidate all booking lists and counts
			invalidateAllBookingQueries(queryClient);
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
			// Invalidate the specific booking detail
			queryClient.invalidateQueries({
				queryKey: bookingKeys.detail(variables.bookingId),
			});
			// Also invalidate lists in case amounts changed
			invalidateAllBookingQueries(queryClient);
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
			// Invalidate all lists and counts (status changed!)
			invalidateAllBookingQueries(queryClient);
			// Invalidate specific booking detail
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
			// Invalidate all lists and counts
			invalidateAllBookingQueries(queryClient);
			// Remove specific booking from cache
			queryClient.removeQueries({ queryKey: bookingKeys.detail(bookingId) });
			clearDraftFromLocalStorage();
		},
	});
}

/**
 * Hook to bulk delete booking drafts
 */
export function useBulkDeleteBookingDrafts() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: bulkDeleteBookingDrafts,
		onSuccess: () => {
			// Invalidate all lists and counts
			invalidateAllBookingQueries(queryClient);
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
 * @deprecated Use useBookingsList from use-bookings-list.ts instead
 */
export function useUserBookings(filters?: { status?: string }) {
	console.warn("useUserBookings is deprecated. Use useBookingsList instead.");
	return useQuery({
		queryKey: [...bookingKeys.all, "list", filters],
		queryFn: async () => {
			const params = new URLSearchParams();
			if (filters?.status) {
				params.set("status", filters.status);
			}
			const response = await fetch(`/api/bookings?${params.toString()}`);
			if (!response.ok) {
				throw new Error("Failed to fetch bookings");
			}
			return response.json();
		},
	});
}

/**
 * Hook to save draft (localStorage utilities)
 */
export function useSaveDraft() {
	return {
		save: saveDraftToLocalStorage,
		load: loadDraftFromLocalStorage,
		clear: clearDraftFromLocalStorage,
	};
}

/**
 * Workspace conflict check types
 */
export interface WorkspaceConflict {
	id: string;
	startDate: Date | string;
	endDate: Date | string;
	bookingRequestId: string;
}

export interface ConflictData {
	proposedStartDate: string;
	proposedEndDate: string;
	existingBookings: WorkspaceConflict[];
}

export interface WorkspaceConflictCheckResult {
	hasConflicts: boolean;
	conflicts: ConflictData[];
}

/**
 * Check for workspace booking conflicts
 */
async function checkWorkspaceConflicts(params: {
	bookingId?: string;
	workspaceBookings: Array<{
		startDate: Date | string;
		endDate: Date | string;
	}>;
}): Promise<WorkspaceConflictCheckResult> {
	const response = await fetch("/api/bookings/check-conflicts", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(params),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || "Failed to check workspace conflicts");
	}

	return response.json();
}

/**
 * Hook to check for workspace booking conflicts
 */
export function useCheckWorkspaceConflicts() {
	return useMutation({
		mutationFn: checkWorkspaceConflicts,
	});
}
