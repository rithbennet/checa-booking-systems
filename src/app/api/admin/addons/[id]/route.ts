/**
 * Admin Add-on Detail API
 *
 * DELETE /api/admin/addons/[id] - Delete a global add-on
 */

import { deleteGlobalAddOn } from "@/entities/addon/server/admin-repository";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

/**
 * DELETE /api/admin/addons/[id]
 */
export const DELETE = createProtectedHandler(
	async (_request: Request, user, ctx) => {
		try {
			if (user.role !== "lab_administrator") return forbidden();

			const params = ctx.params as { id: string } | undefined;
			const id = params?.id;

			if (!id) {
				return Response.json({ error: "Add-on ID required" }, { status: 400 });
			}

			await deleteGlobalAddOn(id);

			return Response.json({ success: true });
		} catch (error) {
			console.error("Error deleting add-on:", error);
			return serverError("Failed to delete add-on");
		}
	},
);
