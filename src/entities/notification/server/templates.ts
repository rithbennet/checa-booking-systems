import type { notification_type_enum } from "generated/prisma";
import type { BookingEvent } from "../model/events";

export function mapBookingEventToTemplate(e: {
	event: BookingEvent;
	comment?: string;
}): {
	title: string;
	message: string;
	type: notification_type_enum;
} {
	switch (e.event) {
		case "BOOKING_APPROVED":
			return {
				title: "Booking approved",
				message: "Your booking has been approved.",
				type: "booking_approved" as notification_type_enum,
			};
		case "BOOKING_REJECTED":
			return {
				title: "Booking rejected",
				message: e.comment ?? "Your booking was rejected.",
				type: "booking_rejected" as notification_type_enum,
			};
		case "BOOKING_REVISION_REQUESTED":
			return {
				title: "More information required",
				message:
					e.comment ?? "Please revise your booking and resubmit for approval.",
				type: "booking_pending_verification" as notification_type_enum,
			};
	}
}
