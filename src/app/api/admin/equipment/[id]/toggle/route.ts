/**
 * Admin Equipment Toggle API
 *
 * PATCH /api/admin/equipment/[id]/toggle - Toggle equipment availability
 */

import { toggleEquipmentAvailability } from "@/entities/lab-equipment/server/admin-actions";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";
import { logAuditEvent } from "@/shared/lib/audit-log";
import { logger } from "@/shared/lib/logger";

/**
 * PATCH /api/admin/equipment/[id]/toggle
 */
export const PATCH = createProtectedHandler(
	async (request: Request, user, ctx) => {
		try {
			if (user.role !== "lab_administrator") return forbidden();

			const params = ctx.params as { id: string } | undefined;
			const id = params?.id;

			if (!id) {
				return Response.json(
					{ error: "Equipment ID required" },
					{ status: 400 },
				);
			}

			const body = await request.json();
			const { isAvailable } = body;

			if (typeof isAvailable !== "boolean") {
				return Response.json(
					{ error: "isAvailable must be a boolean" },
					{ status: 400 },
				);
			}

			const result = await toggleEquipmentAvailability(id, isAvailable);

			// Log audit event
			await logAuditEvent({
				userId: user.id,
				action: "equipment.toggle",
				entity: "equipment",
				entityId: id,
				metadata: {
					isAvailable,
				},
			});

			return Response.json(result);
		} catch (error) {
			const equipmentId = ctx.params?.id;
			logger.error(
				{ error, equipmentId },
				"Error toggling equipment availability",
			);
			return serverError("Failed to toggle equipment availability");
		}
	},
);
