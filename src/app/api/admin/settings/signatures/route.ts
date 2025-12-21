/**
 * Signature Settings API Route
 * GET /api/admin/settings/signatures - Get signature settings
 * PUT /api/admin/settings/signatures - Update signature settings
 *
 * Returns/accepts DocumentConfig format focused on signature-related fields
 */

import { NextResponse } from "next/server";
import {
	getGlobalDocumentConfig,
	updateGlobalDocumentConfig,
} from "@/entities/document-config";
import type { UpdateDocumentConfigInput } from "@/entities/document-config/model/types";
import { requireAdmin } from "@/shared/lib/api-factory";

/**
 * GET signature settings
 */
export async function GET(): Promise<Response> {
	try {
		const adminUser = await requireAdmin();
		if (!adminUser) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const config = await getGlobalDocumentConfig();
		// Return only signature-related fields
		return NextResponse.json({
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
		});
	} catch (error) {
		console.error("Failed to get signature settings:", error);
		if (error instanceof Error && error.message.includes("Forbidden")) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
		return NextResponse.json(
			{ error: "Failed to load signature settings" },
			{ status: 500 },
		);
	}
}

/**
 * PUT/PATCH signature settings
 */
export async function PUT(request: Request): Promise<Response> {
	try {
		const adminUser = await requireAdmin();
		if (!adminUser) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = (await request.json()) as {
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
		return NextResponse.json({
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
		});
	} catch (error) {
		console.error("Failed to update signature settings:", error);
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
			{ error: "Failed to update signature settings" },
			{ status: 500 },
		);
	}
}

// Support PATCH as well
export const PATCH = PUT;
