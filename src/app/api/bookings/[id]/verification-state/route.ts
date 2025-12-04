/**
 * Document Verification State API
 * GET /api/bookings/[id]/verification-state
 *
 * Get the verification state of all key documents for a booking.
 */

import { getDocumentVerificationState } from "@/entities/booking-document/server/repository";
import {
	createProtectedHandler,
	forbidden,
	notFound,
} from "@/shared/lib/api-factory";
import { db } from "@/shared/server/db";

export const GET = createProtectedHandler(
	async (_request, user, { params }) => {
		const bookingId = params?.id;

		if (!bookingId) {
			return notFound("Booking ID is required");
		}

		// Check booking exists and user owns it (unless admin)
		const booking = await db.bookingRequest.findUnique({
			where: { id: bookingId },
			select: { userId: true },
		});

		if (!booking) {
			return notFound("Booking not found");
		}

		// Users can only check their own bookings, admins can check any
		if (user.role !== "lab_administrator" && booking.userId !== user.id) {
			return forbidden("You do not have access to this booking");
		}

		const state = await getDocumentVerificationState(bookingId);

		return Response.json(state);
	},
	{ requireActive: true },
);
