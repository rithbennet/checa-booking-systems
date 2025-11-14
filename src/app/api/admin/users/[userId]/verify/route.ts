import { type NextRequest, NextResponse } from "next/server";
import * as bookingService from "@/entities/booking/server/booking.service";
import {
	forbidden,
	requireAdmin,
	serverError,
	unauthorized,
} from "@/shared/server/policies";

/**
 * POST /api/admin/users/[userId]/verify
 * Admin: Verify user and move pending_user_verification bookings to pending_approval
 */
export async function POST(
	_request: NextRequest,
	{ params }: { params: { userId: string } },
) {
	try {
		const admin = await requireAdmin();

		await bookingService.onUserVerified({
			adminId: admin.adminId,
			userId: params.userId,
		});

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
}
