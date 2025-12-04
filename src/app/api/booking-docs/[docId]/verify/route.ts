/**
 * Booking Document Verify API
 * POST /api/booking-docs/[docId]/verify
 *
 * Allows admins to verify uploaded documents (signed forms, payment receipts).
 * For payment receipts, this also creates a verified Payment record.
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
							serviceForms: {
								include: {
									invoices: {
										orderBy: { createdAt: "desc" },
										take: 1,
									},
								},
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

			// For payment receipts, also create/update the Payment record
			let payment = null;
			if (document.type === "payment_receipt") {
				const latestInvoice = document.booking.serviceForms[0]?.invoices[0];

				if (latestInvoice) {
					const paymentMethod = (body.paymentMethod as string) || "eft";
					const paymentAmount =
						body.amount || document.booking.totalAmount.toString();

					payment = await db.payment.create({
						data: {
							invoiceId: latestInvoice.id,
							amount: paymentAmount,
							paymentMethod: paymentMethod as
								| "eft"
								| "vote_transfer"
								| "local_order",
							paymentDate: new Date(),
							receiptFilePath: document.blob.url,
							status: "verified",
							uploadedBy: document.createdById,
							uploadedAt: document.createdAt,
							verifiedAt: new Date(),
							verifiedBy: user.id,
							verificationNotes: notes || null,
						},
					});

					// Update invoice status to paid
					await db.invoice.update({
						where: { id: latestInvoice.id },
						data: { status: "paid" },
					});
				}
			}

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
						paymentId: payment?.id || null,
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
				payment,
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
