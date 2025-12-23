import { NextResponse } from "next/server";
import * as bookingService from "@/entities/booking/server/booking.service";
import {
	badRequest,
	createProtectedHandler,
	forbidden,
	serverError,
	unauthorized,
} from "@/shared/lib/api-factory";
import { logAuditEvent } from "@/shared/lib/audit-log";
import { logger } from "@/shared/lib/logger";
import { rateLimit } from "@/shared/server/api-middleware";

/** POST /api/bookings/[id]/submit — submit booking for approval (owner only) */
export const POST = createProtectedHandler(
	async (request: Request, user, { params }) => {
		try {
			const bookingId = params?.id;
			if (!bookingId) return badRequest("Booking ID is required");

			// Rate limiting: 5 submissions per minute
			const rateLimitResponse = await rateLimit(request, 5, 60_000);
			if (rateLimitResponse) return rateLimitResponse;

			const userStatus =
				(user.status as
					| "active"
					| "pending"
					| "inactive"
					| "rejected"
					| "suspended") ?? "pending";
			const result = await bookingService.submit({
				userId: user.id,
				bookingId,
				userStatus,
			});

			// Log audit event (fire-and-forget to avoid blocking response)
			void logAuditEvent({
				userId: user.id,
				action: "booking.submit",
				entity: "booking",
				entityId: bookingId,
				metadata: {
					submittedBy: user.id,
				},
			}).catch((auditError) => {
				logger.error(
					{ error: auditError, bookingId, userId: user.id },
					"Failed to log audit event for booking submission",
				);
			});

			return result;
		} catch (error) {
			if (error instanceof bookingService.BookingValidationError) {
				const bookingId = params?.id;
				logger.warn(
					{ error, bookingId, issues: error.issues },
					"Booking validation failed",
				);
				return NextResponse.json(
					{
						error: "Booking validation failed",
						issues: error.issues,
					},
					{ status: 400 },
				);
			}

			if (error instanceof Error) {
				if (error.message === "Unauthorized") return unauthorized();
				if (error.message.includes("Forbidden")) return forbidden();
				if (
					error.message.includes("not submittable") ||
					error.message.includes("validation failed")
				)
					return badRequest(error.message);
			}
			const bookingId = params?.id;
			logger.error({ error, bookingId }, "Error submitting booking");
			return serverError(
				error instanceof Error ? error.message : "Failed to submit booking",
			);
		}
	},
);
