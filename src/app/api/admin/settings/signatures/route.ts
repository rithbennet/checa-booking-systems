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
 * GET signature settings
 */
export const GET = createProtectedHandler(
	async (_req, user) => {
		// Enforce admin role
		if (user.role !== "lab_administrator") {
			return forbidden("Admin access required");
		}

		const config = await getGlobalDocumentConfig();

		// Return only signature-related fields
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

		const rawBody = await req.json();
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

		// Return only signature-related fields
		return {
			staffPic: {
				fullName: updated.staffPic.fullName,
				title: updated.staffPic.title,
				signatureBlobId: updated.staffPic.signatureBlobId,
				signatureImageUrl: updated.staffPic.signatureImageUrl,
			},
			ikohzaHead: {
				name: updated.ikohzaHead.name,
				title: updated.ikohzaHead.title,
				department: updated.ikohzaHead.department,
				institute: updated.ikohzaHead.institute,
				university: updated.ikohzaHead.university,
				address: updated.ikohzaHead.address,
				signatureBlobId: updated.ikohzaHead.signatureBlobId,
				signatureImageUrl: updated.ikohzaHead.signatureImageUrl,
			},
		};
	},
	{ requireActive: true },
);

// Support PATCH as well
export const PATCH = PUT;
