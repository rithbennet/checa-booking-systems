import type { PrismaClient } from "generated/prisma";
import type { BookingEvent } from "../model/events";
import { mapBookingEventToTemplate } from "./templates";

type Tx = Omit<
	PrismaClient,
	"$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export async function sendBookingEvent(
	tx: Tx,
	args: {
		bookingId: string;
		userId: string;
		event: BookingEvent;
		comment?: string;
		oldStatus: string;
		newStatus: string;
	},
) {
	const tpl = mapBookingEventToTemplate({
		event: args.event,
		comment: args.comment,
	});

	await tx.notification.create({
		data: {
			userId: args.userId,
			type: tpl.type,
			relatedEntityType: "booking",
			relatedEntityId: args.bookingId,
			title: tpl.title,
			message: tpl.message,
			emailSent: false,
		},
	});

	// Future: plug email/push providers here only.
}
