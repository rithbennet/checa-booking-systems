import { NextResponse } from "next/server";
import * as bookingService from "@/entities/booking/server/booking.service";
import {
	badRequest,
	createProtectedHandler,
	serverError,
} from "@/shared/lib/api-factory";
import { logAuditEvent } from "@/shared/lib/audit-log";
import { logger } from "@/shared/lib/logger";
import { rateLimit } from "@/shared/server/api-middleware";

/** POST /api/bookings/bulk-delete — delete multiple draft bookings (owner only) */
export const POST = createProtectedHandler(async (request: Request, user) => {
	try {
		// Rate limiting: 5 bulk deletes per minute
		const rateLimitResponse = await rateLimit(request, 5, 60_000);
		if (rateLimitResponse) return rateLimitResponse;

		const body = await request.json();
		const { bookingIds } = body as { bookingIds: string[] };

		if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
			return badRequest("bookingIds must be a non-empty array");
		}

		if (bookingIds.length > 50) {
			return badRequest("Cannot delete more than 50 bookings at once");
		}

		// Delete each booking (will check ownership and draft status)
		const results = await Promise.allSettled(
			bookingIds.map((id) =>
				bookingService.deleteDraft({
					userId: user.id,
					bookingId: id,
				}),
			),
		);

		const successful = results.filter((r) => r.status === "fulfilled").length;
		const failed = results.filter((r) => r.status === "rejected").length;

		// Log audit event for bulk delete
		if (successful > 0) {
			await logAuditEvent({
				userId: user.id,
				action: "booking.bulk_delete",
				entity: "booking",
				metadata: {
					deletedBy: user.id,
					affectedCount: successful,
					totalRequested: bookingIds.length,
					failed,
				},
			});
		}

		return NextResponse.json({
			success: successful > 0,
			deleted: successful,
			failed,
			total: bookingIds.length,
		});
	} catch (error) {
		logger.error({ error, userId: user.id }, "Error bulk deleting bookings");
		return serverError("Failed to delete bookings");
	}
});
