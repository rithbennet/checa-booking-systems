/**
 * Admin Services API
 *
 * GET /api/admin/services - Get paginated list of services
 * POST /api/admin/services - Create a new service
 * PUT /api/admin/services - Update an existing service
 */

import { upsertAdminService } from "@/entities/service/server/admin-actions";
import { getAdminServices } from "@/entities/service/server/admin-repository";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

/**
 * GET /api/admin/services
 */
export const GET = createProtectedHandler(async (request: Request, user) => {
	try {
		if (user.role !== "lab_administrator") return forbidden();

		const { searchParams } = new URL(request.url);

		const search = searchParams.get("search") ?? undefined;
		const category = searchParams.get("category") ?? undefined;
		const status = searchParams.get("status") ?? undefined;
		const page = Math.max(
			1,
			Number.parseInt(searchParams.get("page") ?? "1", 10),
		);
		const perPage = Math.min(
			100,
			Math.max(1, Number.parseInt(searchParams.get("perPage") ?? "20", 10)),
		);

		const result = await getAdminServices({
			search,
			category: category as
				| "ftir_atr"
				| "ftir_kbr"
				| "uv_vis_absorbance"
				| "uv_vis_reflectance"
				| "bet_analysis"
				| "hplc_pda"
				| "working_space"
				| "all"
				| undefined,
			status: status as "all" | "active" | "inactive" | undefined,
			page,
			perPage,
		});

		return Response.json(result);
	} catch (error) {
		console.error("Error fetching services:", error);
		return serverError("Failed to fetch services");
	}
});

/**
 * POST /api/admin/services
 */
export const POST = createProtectedHandler(async (request: Request, user) => {
	try {
		if (user.role !== "lab_administrator") return forbidden();

		const body = await request.json();
		const result = await upsertAdminService(body);

		return Response.json(result, { status: 201 });
	} catch (error) {
		console.error("Error creating service:", error);
		if (error instanceof Error && error.message.includes("Unique constraint")) {
			return Response.json(
				{ error: "A service with this code already exists" },
				{ status: 400 },
			);
		}
		return serverError("Failed to create service");
	}
});

/**
 * PUT /api/admin/services
 */
export const PUT = createProtectedHandler(async (request: Request, user) => {
	try {
		if (user.role !== "lab_administrator") return forbidden();

		const body = await request.json();
		const result = await upsertAdminService(body);

		return Response.json(result);
	} catch (error) {
		console.error("Error updating service:", error);
		if (error instanceof Error && error.message.includes("Unique constraint")) {
			return Response.json(
				{ error: "A service with this code already exists" },
				{ status: 400 },
			);
		}
		return serverError("Failed to update service");
	}
});
