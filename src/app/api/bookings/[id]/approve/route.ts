import { type NextRequest, NextResponse } from "next/server";
import * as bookingService from "@/entities/booking/server/booking.service";
import {
	badRequest,
	forbidden,
	requireAdmin,
	serverError,
	unauthorized,
} from "@/shared/server/policies";

/**
 * POST /api/bookings/[id]/approve
 * Admin: Approve booking
 */
export async function POST(
	_request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const admin = await requireAdmin();

		await bookingService.adminApprove({
			adminId: admin.adminId,
			bookingId: params.id,
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === "Unauthorized") return unauthorized();
			if (error.message.includes("Forbidden")) return forbidden();
			if (error.message.includes("Can only approve")) {
				return badRequest(error.message);
			}
		}
		console.error("Error approving booking:", error);
		return serverError(
			error instanceof Error ? error.message : "Failed to approve booking",
		);
	}
}
