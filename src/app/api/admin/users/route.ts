import { getUserListData } from "@/entities/user/server/user-repository";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

/**
 * GET /api/admin/users
 * Get paginated list of users for admin management
 */
export const GET = createProtectedHandler(async (request: Request, user) => {
	try {
		if (user.role !== "lab_administrator") return forbidden();

		const { searchParams } = new URL(request.url);

		// Parse query params
		const page = Math.max(
			1,
			Number.parseInt(searchParams.get("page") ?? "1", 10),
		);
		const pageSizeRaw = Number.parseInt(
			searchParams.get("pageSize") ?? "25",
			10,
		);
		const pageSize = [10, 25, 50].includes(pageSizeRaw) ? pageSizeRaw : 25;
		const sort = searchParams.get("sort") ?? "created_newest";
		const query = searchParams.get("q") ?? undefined;
		const status = searchParams.get("status") ?? undefined;
		const userType = searchParams.get("userType") ?? "all";

		const result = await getUserListData({
			page,
			pageSize: pageSize as 10 | 25 | 50,
			sort: sort as
				| "created_newest"
				| "created_oldest"
				| "name_asc"
				| "name_desc",
			query,
			status: status as
				| "pending"
				| "active"
				| "inactive"
				| "rejected"
				| "suspended"
				| undefined,
			userType: userType as
				| "mjiit_member"
				| "utm_member"
				| "external_member"
				| "lab_administrator"
				| "all",
		});

		return Response.json(result);
	} catch (error) {
		console.error("Error fetching users:", error);
		return serverError("Failed to fetch users");
	}
});
