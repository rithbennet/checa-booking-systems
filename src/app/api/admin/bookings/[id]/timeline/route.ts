import { z } from "zod";
import { updateBookingTimeline } from "@/entities/booking/server/cancellation-repository";
import { createProtectedHandler } from "@/shared/lib/api-factory";
import { logger } from "@/shared/lib/logger";

const UpdateTimelineSchema = z.object({
	preferredStartDate: z
		.string()
		.datetime({ message: "Invalid ISO 8601 date format" })
		.nullable(),
	preferredEndDate: z
		.string()
		.datetime({ message: "Invalid ISO 8601 date format" })
		.nullable(),
});

/**
 * PATCH /api/admin/bookings/[id]/timeline
 * Updates booking timeline (start/end dates)
 */
export const PATCH = createProtectedHandler(
	async (req, user, { params }) => {
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
				userId: user.id,
				userRole: user.role ?? "",
			});

			if (!result.success) {
				// Map error codes to appropriate status codes
				let statusCode = 400;
				switch (result.errorCode) {
					case "NOT_FOUND":
						statusCode = 404;
						break;
					case "UNAUTHORIZED":
						statusCode = 403;
						break;
					case "INVALID_STATE":
					case "INVALID_INPUT":
						statusCode = 400;
						break;
					default:
						// Backwards compatibility: fallback to string matching
						if (result.error === "Booking not found") {
							statusCode = 404;
						} else if (
							result.error?.includes("Unauthorized") ||
							result.error?.includes("only edit your own")
						) {
							statusCode = 403;
						}
						break;
				}

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

			logger.error(
				{ err: error },
				"[PATCH /api/admin/bookings/[id]/timeline] Internal server error",
			);
			return Response.json({ error: "Internal server error" }, { status: 500 });
		}
	},
	{ allowedRoles: ["lab_administrator"] },
);
