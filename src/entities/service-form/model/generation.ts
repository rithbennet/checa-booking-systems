import type { booking_status_enum } from "generated/prisma";

export const FORM_GENERATION_BOOKING_STATUSES: readonly booking_status_enum[] =
	["approved", "in_progress", "completed"];

export const FORM_GENERATION_STATUS_REQUIREMENT =
	"Booking must be approved, in progress, or completed before generating forms";

export function canGenerateFormsForBookingStatus(
	status: booking_status_enum,
): boolean {
	return FORM_GENERATION_BOOKING_STATUSES.includes(status);
}
