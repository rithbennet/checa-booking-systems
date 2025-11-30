/**
 * Admin Equipment Detail API
 *
 * GET /api/admin/equipment/[id] - Get equipment detail
 */

import { getAdminEquipmentDetail } from "@/entities/lab-equipment/server/admin-repository";
import {
	createProtectedHandler,
	forbidden,
	notFound,
	serverError,
} from "@/shared/lib/api-factory";

/**
 * GET /api/admin/equipment/[id]
 */
export const GET = createProtectedHandler(
	async (_request: Request, user, ctx) => {
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

			const equipment = await getAdminEquipmentDetail(id);

			if (!equipment) {
				return notFound("Equipment not found");
			}

			return Response.json(equipment);
		} catch (error) {
			console.error("Error fetching equipment detail:", error);
			return serverError("Failed to fetch equipment detail");
		}
	},
);
