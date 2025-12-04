/**
 * Booking Document Download API Route
 *
 * GET /api/booking-docs/[docId]/download - Download a booking document
 *
 * Access Control:
 * - Admins: can download any document
 * - Users: can only download documents from their own bookings
 */

import { NextResponse } from "next/server";
import { getDocumentWithBookingOwner } from "@/entities/booking-document/server";
import {
	createProtectedHandler,
	forbidden,
	notFound,
} from "@/shared/lib/api-factory";
import { db } from "@/shared/server/db";

export const GET = createProtectedHandler(async (_req, user, { params }) => {
	const docId = params?.docId;

	if (!docId) {
		return notFound("Document ID is required");
	}

	const isAdmin = user.role === "lab_administrator";

	// Get document with booking owner info for access check
	const result = await getDocumentWithBookingOwner(docId);

	if (!result) {
		return notFound("Document not found");
	}

	const { document, bookingOwnerId } = result;
	const isOwner = bookingOwnerId === user.id;

	// Access control: admins can access any, users can only access their own
	if (!isAdmin && !isOwner) {
		return forbidden("You don't have permission to download this document");
	}

	// Create audit log entry for the download
	await db.auditLog.create({
		data: {
			userId: user.id,
			action: "document_downloaded",
			entity: "BookingDocument",
			entityId: document.id,
			metadata: {
				bookingId: document.bookingId,
				documentType: document.type,
				fileName: document.blob.fileName,
			},
		},
	});

	// Redirect to the UploadThing URL
	// The URL from UploadThing is already a public CDN URL
	return NextResponse.redirect(document.blob.url);
});
