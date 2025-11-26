import type { payment_method_enum } from "generated/prisma";
import { listPendingPayments } from "@/entities/payment/server/repository";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

/**
 * GET /api/admin/finance/payments/pending
 * Get pending payments for verification queue
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

		const result = await listPendingPayments({
			page,
			pageSize,
			q: searchParams.get("q") ?? undefined,
			method: searchParams.get("method") as payment_method_enum | undefined,
		});

		return Response.json(result);
	} catch (error) {
		console.error("Error fetching pending payments:", error);
		return serverError("Failed to fetch pending payments");
	}
});
