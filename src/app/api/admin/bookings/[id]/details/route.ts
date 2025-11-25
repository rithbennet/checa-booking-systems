/**
 * Admin Booking Command Center API Route
 *
 * Fetches comprehensive booking data for the command center view.
 */

import { Prisma } from "generated/prisma";
import { getBookingCommandCenterData } from "@/entities/booking/server/command-center-repository";
import {
	badRequest,
	createProtectedHandler,
	forbidden,
	notFound,
	serverError,
} from "@/shared/lib/api-factory";

export const GET = createProtectedHandler(
	async (
		_request: Request,
		user,
		{ params }: { params?: Record<string, string> },
	) => {
		try {
			if (user.role !== "lab_administrator") return forbidden();

			// Validate params.id
			if (
				!params?.id ||
				typeof params.id !== "string" ||
				params.id.trim() === ""
			) {
				return badRequest("Invalid booking ID");
			}
			const id = params.id;

			const data = await getBookingCommandCenterData(id);
			return data;
		} catch (error) {
			console.error("[admin/bookings/[id]/command-center GET]", error);

			// Handle Prisma not found error (P2025 from findUniqueOrThrow)
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2025"
			) {
				return notFound();
			}

			return serverError("Internal server error");
		}
	},
);
