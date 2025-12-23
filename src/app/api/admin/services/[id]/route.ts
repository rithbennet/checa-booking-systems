/**
 * Admin Service Detail API
 *
 * GET /api/admin/services/[id] - Get service detail
 */

import { getAdminServiceDetail } from "@/entities/service/server/admin-repository";
import {
	createProtectedHandler,
	forbidden,
	notFound,
	serverError,
} from "@/shared/lib/api-factory";
import { logger } from "@/shared/lib/logger";

/**
 * GET /api/admin/services/[id]
 */
export const GET = createProtectedHandler(
	async (_request: Request, user, ctx) => {
		try {
			if (user.role !== "lab_administrator") return forbidden();

			const params = ctx.params as { id: string } | undefined;
			const id = params?.id;

			if (!id) {
				return Response.json({ error: "Service ID required" }, { status: 400 });
			}

			const service = await getAdminServiceDetail(id);

			if (!service) {
				return notFound("Service not found");
			}

			return Response.json(service);
		} catch (error) {
			const serviceId = ctx.params?.id;
			logger.error({ error, serviceId }, "Error fetching service detail");
			return serverError("Failed to fetch service detail");
		}
	},
);
