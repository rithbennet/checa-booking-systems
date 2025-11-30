import { markAllNotificationsAsRead } from "@/entities/notification/server/repository";
import { createProtectedHandler } from "@/shared/lib/api-factory";

/**
 * POST /api/user/notifications/read-all
 * Marks all notifications as read for the current user
 */
export const POST = createProtectedHandler(
	async (_req, user) => {
		const count = await markAllNotificationsAsRead(user.id);
		return { success: true, count };
	},
	{ requireActive: false },
);
