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
import { logAuditEvent } from "@/shared/lib/audit-log";
import { logger } from "@/shared/lib/logger";

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

			// Log audit event (fire-and-forget to avoid blocking response)
			void logAuditEvent({
				userId: user.id,
				action: "addon.toggle",
				entity: "addon",
				entityId: id,
				metadata: {
					isActive: body.isActive,
					addOnName: addOn.name,
				},
			}).catch((auditError) => {
				logger.error(
					{ error: auditError, addOnId: id },
					"Failed to log audit event for addon toggle",
				);
			});

			return Response.json(addOn);
		} catch (error) {
			const addOnId = ctx.params?.id;
			logger.error({ error, addOnId }, "Error toggling add-on status");
			return serverError("Failed to toggle add-on status");
		}
	},
);
