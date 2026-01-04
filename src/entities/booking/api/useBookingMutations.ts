/**
 * Booking Timeline and Status Mutation Hooks
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingKeys } from "./query-keys";

interface UpdateTimelineInput {
	bookingId: string;
	preferredStartDate: string | null;
	preferredEndDate: string | null;
}

interface CancelBookingInput {
	bookingId: string;
	reason?: string;
}

/**
 * Hook to update booking timeline (start/end dates)
 */
export function useUpdateBookingTimeline() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			bookingId,
			preferredStartDate,
			preferredEndDate,
		}: UpdateTimelineInput) => {
			const res = await fetch(`/api/admin/bookings/${bookingId}/timeline`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ preferredStartDate, preferredEndDate }),
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to update timeline");
			}

			return res.json();
		},
		onSuccess: (_, variables) => {
			// Invalidate command center query
			queryClient.invalidateQueries({
				queryKey: bookingKeys.commandCenter(variables.bookingId),
			});
			// Invalidate list queries
			queryClient.invalidateQueries({
				queryKey: bookingKeys.all,
			});
		},
	});
}

/**
 * Hook to cancel a booking
 */
export function useCancelBooking() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ bookingId, reason }: CancelBookingInput) => {
			const res = await fetch(`/api/admin/bookings/${bookingId}/cancel`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ reason }),
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to cancel booking");
			}

			return res.json();
		},
		onSuccess: (_, variables) => {
			// Invalidate command center query
			queryClient.invalidateQueries({
				queryKey: bookingKeys.commandCenter(variables.bookingId),
			});
			// Invalidate list queries
			queryClient.invalidateQueries({
				queryKey: bookingKeys.all,
			});
		},
	});
}
