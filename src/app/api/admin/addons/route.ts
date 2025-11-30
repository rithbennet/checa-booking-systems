/**
 * Admin Add-ons API
 *
 * GET /api/admin/addons - Get all global add-ons
 * POST /api/admin/addons - Create a new global add-on
 * PUT /api/admin/addons - Update an existing global add-on
 */

import {
	createGlobalAddOn,
	getAllGlobalAddOns,
	getGlobalAddOns,
	updateGlobalAddOn,
} from "@/entities/addon/server/admin-repository";
import {
	badRequest,
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

/**
 * GET /api/admin/addons
 */
export const GET = createProtectedHandler(async (request: Request, user) => {
	try {
		if (user.role !== "lab_administrator") return forbidden();

		const { searchParams } = new URL(request.url);
		const showAll = searchParams.get("all") === "true";

		const addOns = showAll
			? await getAllGlobalAddOns()
			: await getGlobalAddOns();

		return Response.json(addOns);
	} catch (error) {
		console.error("Error fetching global add-ons:", error);
		return serverError("Failed to fetch add-ons");
	}
});

/**
 * POST /api/admin/addons
 */
export const POST = createProtectedHandler(async (request: Request, user) => {
	try {
		if (user.role !== "lab_administrator") return forbidden();

		const body = await request.json();

		// Validate required fields
		if (!body.name || typeof body.defaultAmount !== "number") {
			return badRequest("Name and default amount are required");
		}

		const addOn = await createGlobalAddOn({
			name: body.name,
			description: body.description ?? null,
			defaultAmount: body.defaultAmount,
			applicableTo: body.applicableTo ?? "both",
			isActive: body.isActive ?? true,
		});

		return Response.json(addOn, { status: 201 });
	} catch (error) {
		console.error("Error creating add-on:", error);
		return serverError("Failed to create add-on");
	}
});

/**
 * PUT /api/admin/addons
 */
export const PUT = createProtectedHandler(async (request: Request, user) => {
	try {
		if (user.role !== "lab_administrator") return forbidden();

		const body = await request.json();

		// Validate required fields
		if (!body.id || !body.name || typeof body.defaultAmount !== "number") {
			return badRequest("ID, name, and default amount are required");
		}

		const addOn = await updateGlobalAddOn({
			id: body.id,
			name: body.name,
			description: body.description ?? null,
			defaultAmount: body.defaultAmount,
			applicableTo: body.applicableTo,
			isActive: body.isActive,
		});

		return Response.json(addOn);
	} catch (error) {
		console.error("Error updating add-on:", error);
		return serverError("Failed to update add-on");
	}
});
