import { rejectUser } from "@/entities/user/server/user-repository";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

/**
 * POST /api/admin/users/[userId]/reject
 * Reject a pending user account
 */
export const POST = createProtectedHandler(
	async (_request: Request, user, context) => {
		try {
			if (user.role !== "lab_administrator") return forbidden();

			const params = await context?.params;
			const userId = params?.userId as string;

			if (!userId) {
				return Response.json({ error: "User ID required" }, { status: 400 });
			}

			await rejectUser(userId);

			return Response.json({ success: true, message: "User rejected" });
		} catch (error) {
			console.error("Error rejecting user:", error);
			return serverError("Failed to reject user");
		}
	},
);
