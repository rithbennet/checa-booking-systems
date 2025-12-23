import { NextResponse } from "next/server";
import * as bookingService from "@/entities/booking/server/booking.service";
import {
	createProtectedHandler,
	forbidden,
	serverError,
	unauthorized,
} from "@/shared/lib/api-factory";
import { logAuditEvent } from "@/shared/lib/audit-log";
import { logger } from "@/shared/lib/logger";

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

			// Log audit event
			await logAuditEvent({
				userId: user.id,
				action: "user.verify",
				entity: "user",
				entityId: userId,
				metadata: {
					verifiedBy: user.id,
				},
			});

			return NextResponse.json({ success: true });
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "Unauthorized") return unauthorized();
				if (error.message.includes("Forbidden")) return forbidden();
			}
			const userId = params?.userId;
			logger.error({ error, userId }, "Error verifying user");
			return serverError(
				error instanceof Error ? error.message : "Failed to verify user",
			);
		}
	},
);
