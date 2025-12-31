import type { payment_method_enum } from "generated/prisma";
import { listPaymentReceiptHistory } from "@/entities/booking-document/server/payment-receipt-repository";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

/**
 * GET /api/admin/finance/payments/history
 * Get payment receipt history from bookingDocuments (verified and rejected)
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
		const ALLOWED_STATUS = new Set(["verified", "rejected"]);
		let status: ("verified" | "rejected")[] | undefined;

		if (statusParam) {
			const statusValues = statusParam
				.split(",")
				.map((s) => s.trim().toLowerCase());

			for (const val of statusValues) {
				if (!ALLOWED_STATUS.has(val)) {
					return Response.json(
						{
							error: `Invalid status value: "${val}". Allowed values are: verified, rejected`,
						},
						{ status: 400 },
					);
				}
			}

			status = statusValues as ("verified" | "rejected")[];
		}

		const result = await listPaymentReceiptHistory({
			page,
			pageSize,
			q: searchParams.get("q") ?? undefined,
			status,
			method: searchParams.get("method") as payment_method_enum | undefined,
			dateFrom: searchParams.get("dateFrom") ?? undefined,
			dateTo: searchParams.get("dateTo") ?? undefined,
		});

		return Response.json(result);
	} catch (error) {
		console.error("Error fetching payment receipt history:", error);
		return serverError("Failed to fetch payment receipt history");
	}
});
