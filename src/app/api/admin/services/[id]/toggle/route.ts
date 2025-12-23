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
import { logAuditEvent } from "@/shared/lib/audit-log";
import { logger } from "@/shared/lib/logger";

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

			// Log audit event (fire-and-forget to avoid blocking response)
			void logAuditEvent({
				userId: user.id,
				action: "service.toggle",
				entity: "service",
				entityId: id,
				metadata: {
					isActive,
				},
			}).catch((auditError) => {
				logger.error(
					{ error: auditError, serviceId: id },
					"Failed to log audit event for service toggle",
				);
			});

			return Response.json(result);
		} catch (error) {
			const serviceId = ctx.params?.id;
			logger.error({ error, serviceId }, "Error toggling service status");
			return serverError("Failed to toggle service status");
		}
	},
);
