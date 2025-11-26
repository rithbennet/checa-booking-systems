import {
	type FinanceOverviewFilters,
	getFinanceOverview,
} from "@/entities/booking/server/finance-repository";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

/**
 * GET /api/admin/finance/overview
 * Get per-booking financial status overview
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

		const params: FinanceOverviewFilters = {
			page,
			pageSize,
			q: searchParams.get("q") ?? undefined,
			gateStatus: searchParams.get("gateStatus") as
				| "locked"
				| "unlocked"
				| undefined,
			invoiceStatus: searchParams.get("invoiceStatus")?.split(",") ?? undefined,
			userType: searchParams.get("userType") ?? undefined,
		};

		const result = await getFinanceOverview(params);
		return Response.json(result);
	} catch (error) {
		console.error("Error fetching finance overview:", error);
		return serverError("Failed to fetch finance overview");
	}
});
