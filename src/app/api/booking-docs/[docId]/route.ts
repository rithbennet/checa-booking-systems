/**
 * Booking Document API Route
 *
 * DELETE /api/booking-docs/[docId] - Delete a booking document
 *
 * Access Control:
 * - Users can only delete documents from their own bookings
 * - Users cannot delete documents that have been verified
 * - Admins can delete any document
 */

import { getDocumentWithBookingOwner } from "@/entities/booking-document/server";
import {
	createProtectedHandler,
	forbidden,
	notFound,
} from "@/shared/lib/api-factory";
import { db } from "@/shared/server/db";
import { utapi } from "@/shared/server/uploadthing";

export const DELETE = createProtectedHandler(async (_req, user, { params }) => {
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

	// Access control: users can only delete their own documents
	if (!isAdmin && !isOwner) {
		return forbidden("You don't have permission to delete this document");
	}

	// Users cannot delete verified documents (admins can)
	if (!isAdmin && document.verificationStatus === "verified") {
		return forbidden("Cannot delete a verified document");
	}

	// Delete from UploadThing storage first
	try {
		await utapi.deleteFiles(document.blob.key);
	} catch (error) {
		console.error("Failed to delete file from UploadThing:", error);
		// Continue with DB deletion even if UploadThing delete fails
		// The file will be orphaned but we don't want to block the user
	}

	// Delete the document and blob in a transaction
	await db.$transaction(async (tx) => {
		// Delete the booking document first (references blob)
		await tx.bookingDocument.delete({
			where: { id: docId },
		});

		// Delete the blob
		await tx.fileBlob.delete({
			where: { id: document.blob.id },
		});
	});

	// Create audit log entry for the deletion
	await db.auditLog.create({
		data: {
			userId: user.id,
			action: "document_deleted",
			entity: "BookingDocument",
			entityId: docId,
			metadata: {
				bookingId: document.bookingId,
				documentType: document.type,
				fileName: document.blob.fileName,
			},
		},
	});

	return { success: true, message: "Document deleted successfully" };
});
