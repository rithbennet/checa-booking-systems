import { notifyUserAccountApproved } from "@/entities/notification/server";
import { approveUser } from "@/entities/user/server/user-repository";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

/**
 * POST /api/admin/users/[userId]/approve
 * Approve a pending user account
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

			await approveUser(userId, user.id);

			// Send approval notification to user
			await notifyUserAccountApproved({ userId });

			return Response.json({ success: true, message: "User approved" });
		} catch (error) {
			console.error("Error approving user:", error);
			return serverError("Failed to approve user");
		}
	},
);
