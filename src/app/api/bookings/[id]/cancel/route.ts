import { z } from "zod";
import { cancelBookingByUser } from "@/entities/booking/server/cancellation-repository";
import { createProtectedHandler } from "@/shared/lib/api-factory";

const CancelBookingSchema = z.object({
	reason: z.string().optional(),
});

/**
 * POST /api/bookings/[id]/cancel
 * Allows users to cancel their own booking with optional reason
 */
export const POST = createProtectedHandler(async (req, user, { params }) => {
	const id = params?.id;
	if (!id) {
		return Response.json({ error: "Invalid booking ID" }, { status: 400 });
	}

	try {
		const body = await req.json();
		const validated = CancelBookingSchema.parse(body);

		const result = await cancelBookingByUser({
			bookingId: id,
			userId: user.id,
			reason: validated.reason,
		});

		if (!result.success) {
			const statusCode =
				result.error === "Booking not found"
					? 404
					: result.error?.includes("own bookings")
						? 403
						: 400;

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

		console.error("[POST /api/bookings/[id]/cancel]", error);
		return Response.json({ error: "Internal server error" }, { status: 500 });
	}
});
