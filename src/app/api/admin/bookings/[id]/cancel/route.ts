import { z } from "zod";
import { cancelBookingByAdmin } from "@/entities/booking/server/cancellation-repository";
import { createProtectedHandler } from "@/shared/lib/api-factory";

const CancelBookingSchema = z.object({
	reason: z.string().optional(),
});

/**
 * POST /api/admin/bookings/[id]/cancel
 * Cancels a booking with optional reason
 */
export const POST = createProtectedHandler(async (req, user, { params }) => {
	// Check if user is lab_administrator
	if (user.role !== "lab_administrator") {
		return Response.json({ error: "Forbidden" }, { status: 403 });
	}

	const id = params?.id;
	if (!id) {
		return Response.json({ error: "Invalid booking ID" }, { status: 400 });
	}

	try {
		const body = await req.json();
		const validated = CancelBookingSchema.parse(body);

		const result = await cancelBookingByAdmin({
			bookingId: id,
			adminUserId: user.id,
			reason: validated.reason,
		});

		if (!result.success) {
			const statusCode = result.error === "Booking not found" ? 404 : 400;
			return Response.json({ error: result.error }, { status: statusCode });
		}

		return Response.json({
			success: true,
			data: result.data,
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return Response.json(
				{ error: "Invalid input", details: error.errors },
				{ status: 400 },
			);
		}

		console.error("[POST /api/admin/bookings/[id]/cancel]", error);
		return Response.json({ error: "Internal server error" }, { status: 500 });
	}
});
