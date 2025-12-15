import { updateUserType } from "@/entities/user/server/user-repository";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

/**
 * PATCH /api/admin/users/[userId]/type
 * Update user type
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
			const { userType } = body;

			if (
				!["mjiit_member", "utm_member", "external_member", "lab_administrator"].includes(
					userType,
				)
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

			return Response.json({
				success: true,
				message: `User type updated to ${userType}`,
			});
		} catch (error) {
			console.error("Error updating user type:", error);
			return serverError("Failed to update user type");
		}
	},
);

