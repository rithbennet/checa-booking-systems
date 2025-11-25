import { NextResponse } from "next/server";
import * as bookingService from "@/entities/booking/server/booking.service";
import {
	badRequest,
	createProtectedHandler,
	serverError,
} from "@/shared/lib/api-factory";

/** POST /api/bookings/check-conflicts — check for workspace booking conflicts */
export const POST = createProtectedHandler(async (request: Request, user) => {
	try {
		const body = await request.json();
		const { bookingId, workspaceBookings } = body;

		if (!workspaceBookings || !Array.isArray(workspaceBookings)) {
			return badRequest("workspaceBookings array is required");
		}

		// Validate each workspace booking has required fields
		for (const ws of workspaceBookings) {
			if (!ws.startDate || !ws.endDate) {
				return badRequest(
					"Each workspace booking must have startDate and endDate",
				);
			}
		}

		const result = await bookingService.checkWorkspaceConflicts({
			userId: user.id,
			bookingId,
			workspaceBookings,
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error checking workspace conflicts:", error);
		return serverError(
			error instanceof Error
				? error.message
				: "Failed to check workspace conflicts",
		);
	}
});
