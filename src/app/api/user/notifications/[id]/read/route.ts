import { markNotificationAsRead } from "@/entities/notification/server/repository";
import { createProtectedHandler } from "@/shared/lib/api-factory";

/**
 * POST /api/user/notifications/[id]/read
 * Marks a specific notification as read
 */
export const POST = createProtectedHandler(
	async (_req, user, { params }) => {
		const { id } = await params;
		const success = await markNotificationAsRead(id, user.id);

		if (!success) {
			return Response.json(
				{ error: "Notification not found" },
				{ status: 404 },
			);
		}

		return { success: true };
	},
	{ requireActive: false },
);
