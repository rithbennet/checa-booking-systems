/**
 * Signature Settings API Route
 * GET /api/admin/settings/signatures - Get signature settings
 * PUT /api/admin/settings/signatures - Update signature settings
 *
 * Returns/accepts DocumentConfig format focused on signature-related fields
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import {
	getGlobalDocumentConfig,
	updateGlobalDocumentConfig,
} from "@/entities/document-config";
import type { UpdateDocumentConfigInput } from "@/entities/document-config/model/types";
import { createProtectedHandler, forbidden } from "@/shared/lib/api-factory";
import { logAuditEvent } from "@/shared/lib/audit-log";
import { logger } from "@/shared/lib/logger";

/**
 * Zod schema for signature settings request body
 */
const signatureSettingsSchema = z.object({
	staffPic: z
		.object({
			fullName: z.string().optional(),
			title: z.string().nullable().optional(),
			signatureBlobId: z.string().nullable().optional(),
			signatureImageUrl: z.string().nullable().optional(),
		})
		.optional(),
	ikohzaHead: z
		.object({
			name: z.string().optional(),
			title: z.string().nullable().optional(),
			department: z.string().optional(),
			institute: z.string().optional(),
			university: z.string().optional(),
			address: z.string().optional(),
			signatureBlobId: z.string().nullable().optional(),
			signatureImageUrl: z.string().nullable().optional(),
		})
		.optional(),
});

/**
 * Helper to build signature response from config
 */
interface SignatureResponse {
	staffPic: {
		fullName: string;
		title: string | null;
		signatureBlobId: string | null;
		signatureImageUrl: string | null;
	};
	ikohzaHead: {
		name: string;
		title: string | null;
		department: string;
		institute: string;
		university: string;
		address: string;
		signatureBlobId: string | null;
		signatureImageUrl: string | null;
	};
}

function toSignatureResponse(config: {
	staffPic: {
		fullName: string;
		title: string | null;
		signatureBlobId: string | null;
		signatureImageUrl: string | null;
	};
	ikohzaHead: {
		name: string;
		title: string | null;
		department: string;
		institute: string;
		university: string;
		address: string;
		signatureBlobId: string | null;
		signatureImageUrl: string | null;
	};
}): SignatureResponse {
	return {
		staffPic: {
			fullName: config.staffPic.fullName,
			title: config.staffPic.title,
			signatureBlobId: config.staffPic.signatureBlobId,
			signatureImageUrl: config.staffPic.signatureImageUrl,
		},
		ikohzaHead: {
			name: config.ikohzaHead.name,
			title: config.ikohzaHead.title,
			department: config.ikohzaHead.department,
			institute: config.ikohzaHead.institute,
			university: config.ikohzaHead.university,
			address: config.ikohzaHead.address,
			signatureBlobId: config.ikohzaHead.signatureBlobId,
			signatureImageUrl: config.ikohzaHead.signatureImageUrl,
		},
	};
}

/**
 * GET signature settings
 */
export const GET = createProtectedHandler(
	async (_req, user) => {
		// Enforce admin role
		if (user.role !== "lab_administrator") {
			return forbidden("Admin access required");
		}

		const config = await getGlobalDocumentConfig();

		// Return only signature-related fields using helper
		return toSignatureResponse(config);
	},
	{ requireActive: true },
);

/**
 * PUT/PATCH signature settings
 */
export const PUT = createProtectedHandler(
	async (req, user) => {
		// Enforce admin role
		if (user.role !== "lab_administrator") {
			return forbidden("Admin access required");
		}

		let rawBody: unknown;
		try {
			rawBody = await req.json();
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
		const parseResult = signatureSettingsSchema.safeParse(rawBody);

		if (!parseResult.success) {
			return NextResponse.json(
				{ error: "Invalid input", details: parseResult.error.message },
				{ status: 400 },
			);
		}

		const body = parseResult.data as {
			staffPic?: Partial<UpdateDocumentConfigInput["staffPic"]>;
			ikohzaHead?: Partial<UpdateDocumentConfigInput["ikohzaHead"]>;
		};

		// Get current config and merge
		const current = await getGlobalDocumentConfig();
		const updateInput: UpdateDocumentConfigInput = {
			staffPic: body.staffPic
				? { ...current.staffPic, ...body.staffPic }
				: undefined,
			ikohzaHead: body.ikohzaHead
				? { ...current.ikohzaHead, ...body.ikohzaHead }
				: undefined,
		};

		const updated = await updateGlobalDocumentConfig(updateInput);

		// Build detailed updatedFields with nested keys
		const flattenKeys = (
			obj: Record<string, unknown>,
			prefix = "",
		): string[] => {
			return Object.entries(obj).flatMap(([key, value]) => {
				const fullKey = prefix ? `${prefix}.${key}` : key;
				if (value && typeof value === "object" && !Array.isArray(value)) {
					return flattenKeys(value as Record<string, unknown>, fullKey);
				}
				return [fullKey];
			});
		};
		const detailedUpdatedFields = flattenKeys(body as Record<string, unknown>);

		// Log audit event (fire-and-forget to avoid blocking response)
		void logAuditEvent({
			userId: user.id,
			action: "settings.signatures.update",
			entity: "document_config",
			metadata: {
				updatedFields: detailedUpdatedFields,
			},
		}).catch((auditError) => {
			logger.error(
				{ error: auditError },
				"Failed to log audit event for signatures update",
			);
		});

		// Return only signature-related fields using helper
		return toSignatureResponse(updated);
	},
	{ requireActive: true },
);

// Support PATCH as well
export const PATCH = PUT;
