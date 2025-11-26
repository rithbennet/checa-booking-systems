import { getFinanceStats } from "@/entities/booking/server/finance-repository";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

/**
 * GET /api/admin/finance/stats
 * Get finance KPI stats for dashboard header
 */
export const GET = createProtectedHandler(async (_request: Request, user) => {
	try {
		if (user.role !== "lab_administrator") return forbidden();

		const stats = await getFinanceStats();
		return Response.json(stats);
	} catch (error) {
		console.error("Error fetching finance stats:", error);
		return serverError("Failed to fetch finance stats");
	}
});
