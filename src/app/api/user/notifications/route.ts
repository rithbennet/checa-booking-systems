import { getUserNotifications } from "@/entities/notification/server/repository";
import { createProtectedHandler } from "@/shared/lib/api-factory";

/**
 * GET /api/user/notifications
 * Returns the current user's notifications
 */
export const GET = createProtectedHandler(
	async (_req, user) => {
		const data = await getUserNotifications(user.id);
		return data;
	},
	{ requireActive: false },
);
