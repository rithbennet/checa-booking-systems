import { updateUserType } from "@/entities/user/server/user-repository";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";
import { logAuditEvent } from "@/shared/lib/audit-log";
import { logger } from "@/shared/lib/logger";

/**
 * PATCH /api/admin/users/[userId]/type
 * Update user type
 */
export const PATCH = createProtectedHandler(
	async (request: Request, user, context) => {
		const params = await context?.params;
		const userId = params?.userId as string;
		try {
			if (user.role !== "lab_administrator") return forbidden();

			if (!userId) {
				return Response.json({ error: "User ID required" }, { status: 400 });
			}

			const body = await request.json();
			const { userType } = body;

			if (
				![
					"mjiit_member",
					"utm_member",
					"external_member",
					"lab_administrator",
				].includes(userType)
			) {
				return Response.json(
					{
						error:
							"Invalid user type. Must be mjiit_member, utm_member, external_member, or lab_administrator",
					},
					{ status: 400 },
				);
			}

			await updateUserType(userId, userType);

			// Log audit event
			await logAuditEvent({
				userId: user.id,
				action: "user.type_change",
				entity: "user",
				entityId: userId,
				metadata: {
					newUserType: userType,
				},
			});

			return Response.json({
				success: true,
				message: `User type updated to ${userType}`,
			});
		} catch (error) {
			logger.error({ error, userId }, "Error updating user type");
			return serverError("Failed to update user type");
		}
	},
);
