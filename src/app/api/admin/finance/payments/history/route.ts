import type {
	payment_method_enum,
	payment_status_enum,
} from "generated/prisma";
import { listPaymentHistory } from "@/entities/payment/server/repository";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

/**
 * GET /api/admin/finance/payments/history
 * Get payment history (verified and rejected)
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

		const statusParam = searchParams.get("status");
		const status = statusParam
			? (statusParam.split(",") as payment_status_enum[])
			: undefined;

		const result = await listPaymentHistory({
			page,
			pageSize,
			q: searchParams.get("q") ?? undefined,
			status,
			method: searchParams.get("method") as payment_method_enum | undefined,
			verifierId: searchParams.get("verifierId") ?? undefined,
			dateFrom: searchParams.get("dateFrom") ?? undefined,
			dateTo: searchParams.get("dateTo") ?? undefined,
		});

		return Response.json(result);
	} catch (error) {
		console.error("Error fetching payment history:", error);
		return serverError("Failed to fetch payment history");
	}
});
