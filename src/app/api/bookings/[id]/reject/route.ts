import { type NextRequest, NextResponse } from "next/server";
import { adminRejectDto } from "@/entities/booking/server/booking.dto";
import * as bookingService from "@/entities/booking/server/booking.service";
import {
	badRequest,
	forbidden,
	requireAdmin,
	serverError,
	unauthorized,
} from "@/shared/server/policies";

/**
 * POST /api/bookings/[id]/reject
 * Admin: Reject booking
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const admin = await requireAdmin();
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

		await bookingService.adminReject({
			adminId: admin.adminId,
			bookingId: params.id,
			note: validationResult.data.note,
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === "Unauthorized") return unauthorized();
			if (error.message.includes("Forbidden")) return forbidden();
			if (
				error.message.includes("Rejection note") ||
				error.message.includes("Can only reject")
			) {
				return badRequest(error.message);
			}
		}
		console.error("Error rejecting booking:", error);
		return serverError(
			error instanceof Error ? error.message : "Failed to reject booking",
		);
	}
}
