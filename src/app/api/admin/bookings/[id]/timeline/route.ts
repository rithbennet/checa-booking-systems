import { z } from "zod";
import { updateBookingTimeline } from "@/entities/booking/server/cancellation-repository";
import { createProtectedHandler } from "@/shared/lib/api-factory";

const UpdateTimelineSchema = z.object({
	preferredStartDate: z
		.string()
		.nullable()
		.refine((val) => val === null || !Number.isNaN(Date.parse(val)), {
			message: "Invalid date format for preferredStartDate",
		}),
	preferredEndDate: z
		.string()
		.nullable()
		.refine((val) => val === null || !Number.isNaN(Date.parse(val)), {
			message: "Invalid date format for preferredEndDate",
		}),
});

/**
 * PATCH /api/admin/bookings/[id]/timeline
 * Updates booking timeline (start/end dates)
 */
export const PATCH = createProtectedHandler(async (req, user, { params }) => {
	// Check if user is lab_administrator
	if (user.role !== "lab_administrator") {
		return Response.json({ error: "Forbidden" }, { status: 403 });
	}

	try {
		const id = params?.id;
		if (!id) {
			return Response.json({ error: "Invalid booking ID" }, { status: 400 });
		}

		const body = await req.json();
		const validated = UpdateTimelineSchema.parse(body);

		const result = await updateBookingTimeline({
			bookingId: id,
			preferredStartDate: validated.preferredStartDate,
			preferredEndDate: validated.preferredEndDate,
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

		console.error("[PATCH /api/admin/bookings/[id]/timeline]", error);
		return Response.json({ error: "Internal server error" }, { status: 500 });
	}
});
