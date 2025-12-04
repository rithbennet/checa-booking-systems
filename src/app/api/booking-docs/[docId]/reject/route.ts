/**
 * Booking Document Reject API
 * POST /api/booking-docs/[docId]/reject
 *
 * Allows admins to reject uploaded documents (signed forms, payment receipts).
 */

import { getVerifiableDocumentTypes } from "@/entities/booking-document";
import { rejectDocument } from "@/entities/booking-document/server/repository";
import { sendDocumentRejectedNotification } from "@/entities/notification/server/document.notifications";
import {
	badRequest,
	createProtectedHandler,
	forbidden,
	notFound,
	serverError,
} from "@/shared/lib/api-factory";
import { db } from "@/shared/server/db";

export const POST = createProtectedHandler(
	async (request: Request, user, { params }) => {
		try {
			if (user.role !== "lab_administrator") {
				return forbidden("Only administrators can reject documents");
			}

			const documentId = params?.docId;
			if (!documentId) {
				return badRequest("Document ID is required");
			}

			const body = await request.json().catch(() => ({}));
			const reason = body.reason as string | undefined;

			if (!reason?.trim()) {
				return badRequest("Rejection reason is required");
			}

			// Get the document
			const document = await db.bookingDocument.findUnique({
				where: { id: documentId },
				include: {
					booking: {
						select: {
							id: true,
							referenceNumber: true,
							userId: true,
						},
					},
				},
			});

			if (!document) {
				return notFound("Document not found");
			}

			// Check if document type is verifiable (and thus rejectable)
			const verifiableTypes = getVerifiableDocumentTypes();
			if (!verifiableTypes.includes(document.type)) {
				return badRequest(
					`Document type '${document.type}' cannot be rejected`,
				);
			}

			if (document.verificationStatus === "rejected") {
				return badRequest("Document is already rejected");
			}

			if (document.verificationStatus !== "pending_verification") {
				return badRequest("Document is not pending verification");
			}

			// Reject the document
			const rejectedDocument = await rejectDocument(
				documentId,
				user.id,
				reason,
			);

			// Create audit log
			await db.auditLog.create({
				data: {
					userId: user.id,
					action: `reject_${document.type}`,
					entity: "BookingDocument",
					entityId: documentId,
					metadata: {
						bookingId: document.booking.id,
						bookingReference: document.booking.referenceNumber,
						documentType: document.type,
						reason,
					},
				},
			});

			// Send notification to user
			try {
				await sendDocumentRejectedNotification({
					userId: document.booking.userId,
					bookingId: document.booking.id,
					bookingReference: document.booking.referenceNumber,
					documentType: document.type,
					rejectionReason: reason,
				});
			} catch (notificationError) {
				console.error(
					"Failed to send rejection notification:",
					notificationError,
				);
				// Don't fail the request if notification fails
			}

			return Response.json({
				success: true,
				document: rejectedDocument,
			});
		} catch (error) {
			console.error("Error rejecting document:", error);
			if (error instanceof Error) {
				return badRequest(error.message);
			}
			return serverError("Failed to reject document");
		}
	},
);
