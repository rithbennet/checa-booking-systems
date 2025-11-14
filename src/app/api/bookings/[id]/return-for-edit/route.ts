import { type NextRequest, NextResponse } from "next/server";
import { adminReturnForEditDto } from "@/entities/booking/server/booking.dto";
import * as bookingService from "@/entities/booking/server/booking.service";
import {
	badRequest,
	forbidden,
	requireAdmin,
	serverError,
	unauthorized,
} from "@/shared/server/policies";

/**
 * POST /api/bookings/[id]/return-for-edit
 * Admin: Return booking for edit
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const admin = await requireAdmin();
		const body = await request.json();

		// Validate input
		const validationResult = adminReturnForEditDto.safeParse(body);
		if (!validationResult.success) {
			return badRequest(
				`Validation error: ${validationResult.error.errors
					.map((e) => e.message)
					.join(", ")}`,
			);
		}

		await bookingService.adminReturnForEdit({
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
				error.message.includes("Cannot return") ||
				error.message.includes("Can only return")
			) {
				return badRequest(error.message);
			}
		}
		console.error("Error returning booking for edit:", error);
		return serverError(
			error instanceof Error
				? error.message
				: "Failed to return booking for edit",
		);
	}
}
