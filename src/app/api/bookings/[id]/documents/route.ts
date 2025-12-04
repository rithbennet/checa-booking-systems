/**
 * Booking Documents API Route
 *
 * GET /api/bookings/[id]/documents - List all documents for a booking
 */

import { getBookingDocuments } from "@/entities/booking-document/server";
import {
	createProtectedHandler,
	forbidden,
	notFound,
} from "@/shared/lib/api-factory";
import { db } from "@/shared/server/db";

export const GET = createProtectedHandler(async (_req, user, { params }) => {
	const bookingId = params?.id;

	if (!bookingId) {
		return notFound("Booking ID is required");
	}

	const isAdmin = user.role === "lab_administrator";

	// Check if booking exists and user has access
	const booking = await db.bookingRequest.findUnique({
		where: { id: bookingId },
		select: {
			id: true,
			userId: true,
		},
	});

	if (!booking) {
		return notFound("Booking not found");
	}

	const isOwner = booking.userId === user.id;

	// Only admins or booking owners can view documents
	if (!isAdmin && !isOwner) {
		return forbidden("You don't have permission to view these documents");
	}

	const documents = await getBookingDocuments(bookingId);

	return documents;
});
