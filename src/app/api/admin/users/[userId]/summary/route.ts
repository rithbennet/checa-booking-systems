import { getUserSummary } from "@/entities/user/server/profile-repository";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

/**
 * GET /api/admin/users/[userId]/summary
 * Get user summary data for admin view (bookings, financials, documents, etc.)
 */
export const GET = createProtectedHandler(
	async (_request: Request, user, context) => {
		try {
			if (user.role !== "lab_administrator") return forbidden();

			const params = await context?.params;
			const userId = params?.userId as string;

			if (!userId) {
				return Response.json({ error: "User ID required" }, { status: 400 });
			}

			const summary = await getUserSummary(userId);

			if (!summary) {
				return Response.json({ error: "User not found" }, { status: 404 });
			}

			return Response.json(summary);
		} catch (error) {
			console.error("Error fetching user summary:", error);
			return serverError("Failed to fetch user summary");
		}
	},
);
