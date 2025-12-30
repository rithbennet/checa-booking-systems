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
	verificationState: (bookingId: string) =>
		[...bookingDocumentKeys.all, "verification-state", bookingId] as const,
	downloadEligibility: (bookingId: string) =>
		[...bookingDocumentKeys.all, "download-eligibility", bookingId] as const,
	// Payment receipts
	paymentReceipts: (
		type: "pending" | "history",
		params?: Record<string, unknown>,
	) => [...bookingDocumentKeys.all, "payment-receipts", type, params] as const,
};
