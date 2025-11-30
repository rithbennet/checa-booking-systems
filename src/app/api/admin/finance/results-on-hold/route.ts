import { getResultsOnHold } from "@/entities/booking/server/finance-repository";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

/**
 * GET /api/admin/finance/results-on-hold
 * Get bookings with completed analysis but no verified payment
 */
export const GET = createProtectedHandler(async (request: Request, user) => {
	try {
		if (user.role !== "lab_administrator") return forbidden();

		const { searchParams } = new URL(request.url);

		const page = Math.max(
			1,
			Number.parseInt(searchParams.get("page") ?? "1", 10),
		);
		const pageSizeRaw = Number.parseInt(
			searchParams.get("pageSize") ?? "25",
			10,
		);
		const pageSize = [10, 25, 50].includes(pageSizeRaw) ? pageSizeRaw : 25;

		const result = await getResultsOnHold({
			page,
			pageSize,
			q: searchParams.get("q") ?? undefined,
		});

		return Response.json(result);
	} catch (error) {
		console.error("Error fetching results on hold:", error);
		return serverError("Failed to fetch results on hold");
	}
});
