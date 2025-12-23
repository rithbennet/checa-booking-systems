import { adminRejectDto } from "@/entities/booking/server/booking.dto";
import * as bookingService from "@/entities/booking/server/booking.service";
import {
	badRequest,
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";
import { logAuditEvent } from "@/shared/lib/audit-log";
import { logger } from "@/shared/lib/logger";

/**
 * POST /api/admin/bookings/[id]/reject
 * Admin: Reject booking — protected by createProtectedHandler + role check
 */
export const POST = createProtectedHandler(
	async (request: Request, user, { params }) => {
		const bookingId = params?.id;
		try {
			if (user.role !== "lab_administrator") return forbidden();

			const body = await request.json();

			// Validate input
			const validationResult = adminRejectDto.safeParse(body);
			if (!validationResult.success) {
				return badRequest(
					`Validation error: ${validationResult.error.errors
						.map((e) => e.message)
						.join(", ")}`,
				);
			}

			if (!bookingId) return badRequest("Booking ID is required");

			await bookingService.adminReject({
				adminId: user.id,
				bookingId,
				note: validationResult.data.note,
			});

			// Log audit event (fire-and-forget)
			void logAuditEvent({
				userId: user.id,
				action: "booking.reject",
				entity: "booking",
				entityId: bookingId,
				metadata: {
					rejectedBy: user.id,
					note: validationResult.data.note || undefined,
				},
			}).catch((error) => {
				logger.error(
					{ error, bookingId },
					"Failed to log audit event for booking rejection",
				);
			});

			return { success: true };
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "Unauthorized") return { error: "Unauthorized" };
				if (error.message.includes("Forbidden")) return forbidden();
				if (
					error.message.includes("Rejection note") ||
					error.message.includes("Can only reject")
				)
					return badRequest(error.message);
			}
			logger.error({ error, bookingId }, "Error rejecting booking");
			return serverError(
				error instanceof Error ? error.message : "Failed to reject booking",
			);
		}
	},
);
