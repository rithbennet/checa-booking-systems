import { notifyUserAccountRejected } from "@/entities/notification/server";
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
	async (request: Request, user, context) => {
		try {
			if (user.role !== "lab_administrator") return forbidden();

			const params = await context?.params;
			const userId = params?.userId as string;

			if (!userId) {
				return Response.json({ error: "User ID required" }, { status: 400 });
			}

			// Get optional reason from body
			let reason: string | undefined;
			try {
				const body = await request.json();
				reason = body?.reason;
			} catch {
				// No body provided, that's ok
			}

			await rejectUser(userId);

			// Send rejection notification to user
			await notifyUserAccountRejected({ userId, reason });

			return Response.json({ success: true, message: "User rejected" });
		} catch (error) {
			console.error("Error rejecting user:", error);
			return serverError("Failed to reject user");
		}
	},
);
