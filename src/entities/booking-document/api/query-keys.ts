/**
 * Booking Document Query Keys
 *
 * Factory for TanStack Query keys used in booking document queries.
 */

export const bookingDocumentKeys = {
	all: ["booking-documents"] as const,
	byBooking: (bookingId: string) =>
		[...bookingDocumentKeys.all, "booking", bookingId] as const,
	detail: (id: string) => [...bookingDocumentKeys.all, "detail", id] as const,
};
