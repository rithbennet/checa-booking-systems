/**
 * User Booking Detail API Route
 *
 * Fetches user's own booking detail data with ownership check.
 */

import { getUserBookingDetailData } from "@/entities/booking/server/user-detail-repository";
import {
	badRequest,
	createProtectedHandler,
	notFound,
} from "@/shared/lib/api-factory";

export const GET = createProtectedHandler(
	async (
		_request: Request,
		user,
		{ params }: { params?: Record<string, string> },
	) => {
		// Validate params.id
		if (
			!params?.id ||
			typeof params.id !== "string" ||
			params.id.trim() === ""
		) {
			return badRequest("Invalid booking ID");
		}

		const id = params.id;
		const data = await getUserBookingDetailData(id, user.id);

		if (!data) {
			return notFound("Booking not found");
		}

		return data;
	},
);
