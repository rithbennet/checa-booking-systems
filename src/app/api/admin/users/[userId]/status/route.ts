import { notifyUserAccountStatusChanged } from "@/entities/notification/server";
import { updateUserStatus } from "@/entities/user/server/user-repository";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";
import { logAuditEvent } from "@/shared/lib/audit-log";
import { logger } from "@/shared/lib/logger";

/**
 * PATCH /api/admin/users/[userId]/status
 * Update user status (active, inactive, suspended)
 */
export const PATCH = createProtectedHandler(
	async (request: Request, user, context) => {
		try {
			if (user.role !== "lab_administrator") return forbidden();

			const params = await context?.params;
			const userId = params?.userId as string;

			if (!userId) {
				return Response.json({ error: "User ID required" }, { status: 400 });
			}

			const body = await request.json();
			const { status, reason } = body;

			if (!["active", "inactive", "suspended"].includes(status)) {
				return Response.json(
					{ error: "Invalid status. Must be active, inactive, or suspended" },
					{ status: 400 },
				);
			}

			await updateUserStatus(userId, status);

			// Send notification for inactive or suspended status
			if (status === "inactive" || status === "suspended") {
				await notifyUserAccountStatusChanged({
					userId,
					status,
					reason,
				});
			}

			// Log audit event
			await logAuditEvent({
				userId: user.id,
				action: "user.status_change",
				entity: "user",
				entityId: userId,
				metadata: {
					newStatus: status,
					reason: reason || undefined,
				},
			});

			return Response.json({
				success: true,
				message: `User status updated to ${status}`,
			});
		} catch (error) {
			const params = await context?.params;
			const userId = params?.userId as string;
			logger.error({ error, userId }, "Error updating user status");
			return serverError("Failed to update user status");
		}
	},
);
