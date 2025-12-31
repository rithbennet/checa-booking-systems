import type { form_status_enum } from "generated/prisma";
import { listServiceFormsForReview } from "@/entities/service-form/server/repository";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

/**
 * GET /api/admin/finance/forms
 * Get paginated list of service forms
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
			? (statusParam.split(",") as form_status_enum[])
			: undefined;

		const result = await listServiceFormsForReview({
			page,
			pageSize,
			q: searchParams.get("q") ?? undefined,
			status,
			bookingId: searchParams.get("bookingId") ?? undefined,
		});

		return Response.json(result);
	} catch (error) {
		console.error("Error fetching service forms:", error);
		return serverError("Failed to fetch service forms");
	}
});
