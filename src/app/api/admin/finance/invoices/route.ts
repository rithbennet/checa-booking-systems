import type { invoice_status_enum } from "generated/prisma";
import { listInvoices } from "@/entities/invoice/server/repository";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

/**
 * GET /api/admin/finance/invoices
 * Get paginated list of invoices
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
			? (statusParam.split(",") as invoice_status_enum[])
			: undefined;

		const result = await listInvoices({
			page,
			pageSize,
			q: searchParams.get("q") ?? undefined,
			status,
			bookingId: searchParams.get("bookingId") ?? undefined,
			serviceFormId: searchParams.get("serviceFormId") ?? undefined,
			dueDateFrom: searchParams.get("dueDateFrom") ?? undefined,
			dueDateTo: searchParams.get("dueDateTo") ?? undefined,
		});

		return Response.json(result);
	} catch (error) {
		console.error("Error fetching invoices:", error);
		return serverError("Failed to fetch invoices");
	}
});
