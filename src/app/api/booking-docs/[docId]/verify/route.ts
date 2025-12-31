/**
 * Booking Document Verify API
 * POST /api/booking-docs/[docId]/verify
 *
 * Allows admins to verify uploaded documents (signed forms, payment receipts).
 * For signed forms, this updates ServiceForm fields with the signed document paths.
 * Payment receipts are verified via the bookingDocument verificationStatus field.
 */

import { getVerifiableDocumentTypes } from "@/entities/booking-document";
import { verifyDocument } from "@/entities/booking-document/server/repository";
import { sendDocumentVerifiedNotification } from "@/entities/notification/server/document.notifications";
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
				return forbidden("Only administrators can verify documents");
			}

			const documentId = params?.docId;
			if (!documentId) {
				return badRequest("Document ID is required");
			}

			const body = await request.json().catch(() => ({}));
			const notes = body.notes as string | undefined;

			// Get the document with booking info
			const document = await db.bookingDocument.findUnique({
				where: { id: documentId },
				include: {
					blob: true,
					booking: {
						select: {
							id: true,
							referenceNumber: true,
							userId: true,
							totalAmount: true,
						},
						include: {
							serviceForms: {
								orderBy: { createdAt: "desc" },
								take: 1,
							},
						},
					},
				},
			});

			if (!document) {
				return notFound("Document not found");
			}

			// Check if document type is verifiable
			const verifiableTypes = getVerifiableDocumentTypes();
			if (!verifiableTypes.includes(document.type)) {
				return badRequest(
					`Document type '${document.type}' cannot be verified`,
				);
			}

			if (document.verificationStatus === "verified") {
				return badRequest("Document is already verified");
			}

			if (document.verificationStatus !== "pending_verification") {
				return badRequest("Document is not pending verification");
			}

			const latestForm = document.booking.serviceForms[0];

			// For signed service forms, update ServiceForm fields
			if (document.type === "service_form_signed" && latestForm) {
				await db.serviceForm.update({
					where: { id: latestForm.id },
					data: {
						serviceFormSignedPdfPath: document.blob.url,
						signedFormsUploadedAt: document.createdAt,
						signedFormsUploadedBy: document.createdById,
						status: "signed_forms_uploaded",
					},
				});
			}

			// For signed workspace forms, update ServiceForm fields
			if (document.type === "workspace_form_signed" && latestForm) {
				await db.serviceForm.update({
					where: { id: latestForm.id },
					data: {
						workingAreaAgreementSignedPdfPath: document.blob.url,
					},
				});
			}

			// Payment receipts: No separate Payment record created
			// The bookingDocument verification status is the source of truth

			// Verify the document
			const verifiedDocument = await verifyDocument(documentId, user.id, notes);

			// Create audit log
			await db.auditLog.create({
				data: {
					userId: user.id,
					action: `verify_${document.type}`,
					entity: "BookingDocument",
					entityId: documentId,
					metadata: {
						bookingId: document.booking.id,
						bookingReference: document.booking.referenceNumber,
						documentType: document.type,
						notes,
					},
				},
			});

			// Send notification to user
			try {
				await sendDocumentVerifiedNotification({
					userId: document.booking.userId,
					bookingId: document.booking.id,
					bookingReference: document.booking.referenceNumber,
					documentType: document.type,
				});
			} catch (notificationError) {
				console.error(
					"Failed to send verification notification:",
					notificationError,
				);
				// Don't fail the request if notification fails
			}

			return Response.json({
				success: true,
				document: verifiedDocument,
			});
		} catch (error) {
			console.error("Error verifying document:", error);
			if (error instanceof Error) {
				return badRequest(error.message);
			}
			return serverError("Failed to verify document");
		}
	},
);
