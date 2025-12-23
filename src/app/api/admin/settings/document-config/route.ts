/**
 * Document Config API Route
 * GET /api/admin/settings/document-config - Get global document configuration
 * PUT /api/admin/settings/document-config - Update global document configuration
 */

import { NextResponse } from "next/server";
import {
	getGlobalDocumentConfig,
	updateGlobalDocumentConfig,
} from "@/entities/document-config";
import { updateDocumentConfigSchema } from "@/entities/document-config/model/schema";
import { requireAdmin } from "@/shared/lib/api-factory";
import { logAuditEvent } from "@/shared/lib/audit-log";
import { logger } from "@/shared/lib/logger";

/**
 * GET global document configuration
 */
export async function GET(): Promise<Response> {
	try {
		await requireAdmin();

		const config = await getGlobalDocumentConfig();
		return NextResponse.json(config);
	} catch (error) {
		logger.error({ error }, "Failed to get document config");
		if (error instanceof Error && error.message.includes("Forbidden")) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
		return NextResponse.json(
			{ error: "Failed to load document configuration" },
			{ status: 500 },
		);
	}
}

/**
 * PUT/PATCH global document configuration
 */
export async function PUT(request: Request): Promise<Response> {
	try {
		const admin = await requireAdmin();

		let rawBody: unknown;
		try {
			rawBody = await request.json();
		} catch (jsonError) {
			return NextResponse.json(
				{
					error: "Malformed JSON",
					details:
						jsonError instanceof Error
							? jsonError.message
							: "Invalid JSON in request body",
				},
				{ status: 400 },
			);
		}
		const parseResult = updateDocumentConfigSchema.safeParse(rawBody);
		if (!parseResult.success) {
			return NextResponse.json(
				{ error: "Invalid input", details: parseResult.error.message },
				{ status: 400 },
			);
		}
		const body = parseResult.data;
		const updated = await updateGlobalDocumentConfig(body);

		// Log audit event (fire-and-forget to avoid blocking response)
		void logAuditEvent({
			userId: admin.adminId,
			action: "settings.document_config.update",
			entity: "document_config",
			metadata: {
				updatedFields: Object.keys(body),
			},
		}).catch((auditError) =>
			logger.error(
				{ error: auditError, adminId: admin.adminId },
				"Failed to log audit event for document config update",
			),
		);

		return NextResponse.json(updated);
	} catch (error) {
		logger.error({ error }, "Failed to update document config");
		if (error instanceof Error && error.message.includes("Forbidden")) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		return NextResponse.json(
			{ error: "Failed to update document configuration" },
			{ status: 500 },
		);
	}
}

// Support PATCH as well
export const PATCH = PUT;
