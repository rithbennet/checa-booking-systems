/**
 * Admin Equipment API
 *
 * GET /api/admin/equipment - Get paginated list of equipment
 * POST /api/admin/equipment - Create new equipment
 * PUT /api/admin/equipment - Update existing equipment
 */

import { upsertAdminEquipment } from "@/entities/lab-equipment/server/admin-actions";
import { getAdminEquipment } from "@/entities/lab-equipment/server/admin-repository";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

/**
 * GET /api/admin/equipment
 */
export const GET = createProtectedHandler(async (request: Request, user) => {
	try {
		if (user.role !== "lab_administrator") return forbidden();

		const { searchParams } = new URL(request.url);

		const search = searchParams.get("search") ?? undefined;
		const availability = searchParams.get("availability") ?? undefined;
		const page = Math.max(
			1,
			Number.parseInt(searchParams.get("page") ?? "1", 10),
		);
		const perPage = Math.min(
			100,
			Math.max(1, Number.parseInt(searchParams.get("perPage") ?? "20", 10)),
		);

		const result = await getAdminEquipment({
			search,
			availability: availability as
				| "all"
				| "available"
				| "unavailable"
				| undefined,
			page,
			perPage,
		});

		return Response.json(result);
	} catch (error) {
		console.error("Error fetching equipment:", error);
		return serverError("Failed to fetch equipment");
	}
});

/**
 * POST /api/admin/equipment
 */
export const POST = createProtectedHandler(async (request: Request, user) => {
	try {
		if (user.role !== "lab_administrator") return forbidden();

		const body = await request.json();
		const result = await upsertAdminEquipment(body);

		return Response.json(result, { status: 201 });
	} catch (error) {
		console.error("Error creating equipment:", error);
		if (error instanceof Error && error.message.includes("Unique constraint")) {
			return Response.json(
				{ error: "Equipment with this name already exists" },
				{ status: 400 },
			);
		}
		return serverError("Failed to create equipment");
	}
});

/**
 * PUT /api/admin/equipment
 */
export const PUT = createProtectedHandler(async (request: Request, user) => {
	try {
		if (user.role !== "lab_administrator") return forbidden();

		const body = await request.json();
		const result = await upsertAdminEquipment(body);

		return Response.json(result);
	} catch (error) {
		console.error("Error updating equipment:", error);
		if (error instanceof Error && error.message.includes("Unique constraint")) {
			return Response.json(
				{ error: "Equipment with this name already exists" },
				{ status: 400 },
			);
		}
		return serverError("Failed to update equipment");
	}
});
