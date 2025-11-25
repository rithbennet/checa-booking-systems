import { getUserStatusCounts } from "@/entities/user/server/user-repository";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

/**
 * GET /api/admin/users/counts
 * Get user status counts for admin dashboard
 */
export const GET = createProtectedHandler(async (_request: Request, user) => {
	try {
		if (user.role !== "lab_administrator") return forbidden();

		const counts = await getUserStatusCounts();
		return Response.json(counts);
	} catch (error) {
		console.error("Error fetching user counts:", error);
		return serverError("Failed to fetch user counts");
	}
});
