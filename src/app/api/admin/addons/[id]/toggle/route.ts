/**
 * Admin Add-on Toggle API
 *
 * PATCH /api/admin/addons/[id]/toggle - Toggle add-on active status
 */

import { toggleAddOnActive } from "@/entities/addon/server/admin-repository";
import {
	badRequest,
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

/**
 * PATCH /api/admin/addons/[id]/toggle
 */
export const PATCH = createProtectedHandler(
	async (request: Request, user, ctx) => {
		try {
			if (user.role !== "lab_administrator") return forbidden();

			const params = ctx.params as { id: string } | undefined;
			const id = params?.id;

			if (!id) {
				return Response.json({ error: "Add-on ID required" }, { status: 400 });
			}

			const body = await request.json();

			if (typeof body.isActive !== "boolean") {
				return badRequest("isActive must be a boolean");
			}

			const addOn = await toggleAddOnActive(id, body.isActive);

			return Response.json(addOn);
		} catch (error) {
			console.error("Error toggling add-on status:", error);
			return serverError("Failed to toggle add-on status");
		}
	},
);
