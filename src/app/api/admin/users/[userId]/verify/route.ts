import { NextResponse } from "next/server";
import * as bookingService from "@/entities/booking/server/booking.service";
import {
	createProtectedHandler,
	forbidden,
	serverError,
	unauthorized,
} from "@/shared/lib/api-factory";

/** POST /api/admin/users/[userId]/verify — verify a user and update related bookings */
export const POST = createProtectedHandler(
	async (_request: Request, user, { params }) => {
		try {
			if (user.role !== "lab_administrator") return forbidden();

			const userId = params?.userId;
			if (!userId)
				return NextResponse.json(
					{ error: "User ID required" },
					{ status: 400 },
				);

			await bookingService.onUserVerified({ adminId: user.id, userId });

			return NextResponse.json({ success: true });
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "Unauthorized") return unauthorized();
				if (error.message.includes("Forbidden")) return forbidden();
			}
			console.error("Error verifying user:", error);
			return serverError(
				error instanceof Error ? error.message : "Failed to verify user",
			);
		}
	},
);
