import type { booking_status_enum, Prisma } from "generated/prisma";
import { sendBookingEvent } from "@/entities/notification/server/factory";
import { db } from "@/shared/server/db";

type AdminAction = "approve" | "reject" | "request_revision";

function nextStatus(action: AdminAction): booking_status_enum {
	if (action === "approve") return "approved";
	if (action === "reject") return "rejected";
	return "revision_requested";
}

export async function doAdminAction(params: {
	bookingId: string;
	adminUserId: string;
	action: AdminAction;
	comment?: string;
}) {
	const { bookingId, adminUserId, action, comment } = params;

	return db.$transaction(async (tx) => {
		const b = await tx.bookingRequest.findUniqueOrThrow({
			where: { id: bookingId },
			select: { id: true, status: true, userId: true },
		});

		const isActionable =
			b.status === "pending_approval" || b.status === "revision_submitted";

		if (!isActionable) {
			throw new Error("Booking is not in a reviewable state");
		}

		const updated = await tx.bookingRequest.update({
			where: { id: bookingId },
			data: {
				status: nextStatus(action),
				reviewedBy: adminUserId,
				reviewedAt: new Date(),
				reviewNotes: comment,
			},
		});

		await sendBookingEvent(tx, {
			bookingId: b.id,
			userId: b.userId,
			event:
				action === "approve"
					? "BOOKING_APPROVED"
					: action === "reject"
						? "BOOKING_REJECTED"
						: "BOOKING_REVISION_REQUESTED",
			comment,
			oldStatus: b.status,
			newStatus: updated.status,
		});

		await tx.auditLog.create({
			data: {
				userId: adminUserId,
				action: `booking.${action}`,
				entity: "booking",
				entityId: b.id,
				metadata: {
					oldStatus: b.status,
					newStatus: updated.status,
					comment,
				} as Prisma.JsonObject,
			},
		});

		return updated;
	});
}

export async function doBulkAdminAction(params: {
	ids: string[];
	adminUserId: string;
	action: AdminAction | "delete";
	comment?: string;
}) {
	const { ids, adminUserId, action, comment } = params;

	if (action === "delete") {
		// Only safe deletions
		await db.bookingRequest.deleteMany({
			where: {
				id: { in: ids },
				status: {
					in: ["draft", "rejected", "cancelled", "revision_requested"],
				},
			},
		});
		return { ok: true };
	}

	// Loop to keep notifications/audit per item
	const results = [];
	for (const id of ids) {
		try {
			await doAdminAction({
				bookingId: id,
				adminUserId,
				action: action as AdminAction,
				comment,
			});
			results.push({ id, ok: true });
		} catch (e: unknown) {
			const errorMessage = e instanceof Error ? e.message : "Unknown error";
			results.push({ id, ok: false, error: errorMessage });
		}
	}
	return { results };
}
