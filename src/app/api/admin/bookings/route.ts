import { mapToBookingListItemVM } from "@/entities/booking/model/mappers";
import { repoAdminList } from "@/entities/booking/review/server/repository";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

export const GET = createProtectedHandler(async (request: Request, user) => {
	try {
		if (user.role !== "lab_administrator") return forbidden();

		const { searchParams } = new URL(request.url);
		const status = searchParams.get("status")?.split(",").filter(Boolean);
		const query = searchParams.get("query") ?? undefined;

		// Parse and sanitize page
		const pageRaw = Number.parseInt(searchParams.get("page") ?? "1", 10);
		const page = Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;

		// Parse and sanitize pageSize
		const pageSizeRaw = Number.parseInt(
			searchParams.get("pageSize") ?? "25",
			10,
		);
		const pageSize =
			Number.isNaN(pageSizeRaw) || pageSizeRaw < 1
				? 25
				: pageSizeRaw > 100
					? 100
					: pageSizeRaw;

		const sortField = searchParams.get("sortField") ?? "updatedAt";

		// Coerce sortDirection to only "asc" or "desc"
		const sortDirectionRaw = searchParams.get("sortDirection") ?? "desc";
		const sortDirection =
			sortDirectionRaw === "asc" || sortDirectionRaw === "desc"
				? sortDirectionRaw
				: "desc";

		const result = await repoAdminList({
			status,
			query,
			page,
			pageSize,
			sortField,
			sortDirection,
		});

		const items = result.items.map(mapToBookingListItemVM);

		return {
			items,
			total: result.total,
			page: result.page,
			pageSize: result.pageSize,
			totalPages: Math.ceil(result.total / result.pageSize),
		};
	} catch (error) {
		console.error("[admin/bookings GET]", error);
		return serverError("Internal server error");
	}
});
