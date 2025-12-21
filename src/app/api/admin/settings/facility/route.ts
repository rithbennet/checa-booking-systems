/**
 * Facility Settings API Route
 * GET /api/admin/settings/facility - Get facility settings
 * PUT /api/admin/settings/facility - Update facility settings
 *
 * Returns/accepts DocumentConfig format
 */

import { NextResponse } from "next/server";
import {
	getGlobalDocumentConfig,
	updateGlobalDocumentConfig,
} from "@/entities/document-config";
import type { UpdateDocumentConfigInput } from "@/entities/document-config/model/types";
import { requireAdmin } from "@/shared/lib/api-factory";

/**
 * GET facility settings
 */
export async function GET(): Promise<Response> {
	try {
		const adminUser = await requireAdmin();
		if (!adminUser) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const config = await getGlobalDocumentConfig();
		return NextResponse.json(config);
	} catch (error) {
		console.error("Failed to get facility settings:", error);
		if (error instanceof Error && error.message.includes("Forbidden")) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
		return NextResponse.json(
			{ error: "Failed to load facility settings" },
			{ status: 500 },
		);
	}
}

/**
 * PUT/PATCH facility settings
 */
export async function PUT(request: Request): Promise<Response> {
	try {
		const adminUser = await requireAdmin();
		if (!adminUser) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = (await request.json()) as UpdateDocumentConfigInput;
		const updated = await updateGlobalDocumentConfig(body);

		return NextResponse.json(updated);
	} catch (error) {
		console.error("Failed to update facility settings:", error);
		if (error instanceof Error && error.message.includes("Forbidden")) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
		if (error instanceof Error && error.name === "ZodError") {
			return NextResponse.json(
				{ error: "Invalid input", details: error.message },
				{ status: 400 },
			);
		}
		return NextResponse.json(
			{ error: "Failed to update facility settings" },
			{ status: 500 },
		);
	}
}

// Support PATCH as well
export const PATCH = PUT;
