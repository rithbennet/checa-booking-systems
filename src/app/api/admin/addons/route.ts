/**
 * Admin Add-ons API
 *
 * GET /api/admin/addons - Get all global add-ons
 */

import { getGlobalAddOns } from "@/entities/addon/server/admin-repository";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

/**
 * GET /api/admin/addons
 */
export const GET = createProtectedHandler(async (_request: Request, user) => {
	try {
		if (user.role !== "lab_administrator") return forbidden();

		const addOns = await getGlobalAddOns();

		return Response.json(addOns);
	} catch (error) {
		console.error("Error fetching global add-ons:", error);
		return serverError("Failed to fetch add-ons");
	}
});
