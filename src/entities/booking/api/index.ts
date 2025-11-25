/**
 * Booking Entity API - Centralized exports
 * All TanStack Query hooks and utilities for booking operations
 * Following Feature-Sliced Design patterns
 */

// Core query hooks
// Mutation hooks
export {
	bookingKeys,
	invalidateAllBookingQueries,
	useBooking,
	useBulkDeleteBookingDrafts,
	useCreateBooking, // @deprecated - use draft flow instead
	useCreateBookingDraft,
	useDeleteBookingDraft,
	useSaveBookingDraft,
	useSaveDraft, // localStorage utilities
	useSubmitBooking,
} from "./use-bookings";

// List & pagination hooks (primary API)
export {
	type BookingListItem,
	bookingsListKeys,
	type SortKey,
	type UseBookingsListParams,
	useBookingStatusCounts,
	useBookingsList,
} from "./use-bookings-list";

// Equipment hooks
export { useAvailableEquipment } from "./use-equipment";

// Admin hooks
export { useAdminBookingDetail } from "./useAdminBookingDetail";
export { useAdminBookingList } from "./useAdminBookingList";
export { useBookingCommandCenter } from "./useBookingCommandCenter";
