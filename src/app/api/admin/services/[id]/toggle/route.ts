/**
 * Admin Service Toggle API
 *
 * PATCH /api/admin/services/[id]/toggle - Toggle service active status
 */

import { toggleServiceActive } from "@/entities/service/server/admin-actions";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

/**
 * PATCH /api/admin/services/[id]/toggle
 */
export const PATCH = createProtectedHandler(
	async (request: Request, user, ctx) => {
		try {
			if (user.role !== "lab_administrator") return forbidden();

			const params = ctx.params as { id: string } | undefined;
			const id = params?.id;

			if (!id) {
				return Response.json({ error: "Service ID required" }, { status: 400 });
			}

			const body = await request.json();
			const { isActive } = body;

			if (typeof isActive !== "boolean") {
				return Response.json(
					{ error: "isActive must be a boolean" },
					{ status: 400 },
				);
			}

			const result = await toggleServiceActive(id, isActive);

			return Response.json(result);
		} catch (error) {
			console.error("Error toggling service status:", error);
			return serverError("Failed to toggle service status");
		}
	},
);
