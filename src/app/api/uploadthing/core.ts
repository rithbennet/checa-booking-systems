/**
 * UploadThing File Router
 *
 * Handles file uploads for booking documents:
 * - Admin: upload invoice PDFs, sample results
 * - Users: upload signed service forms, workspace forms, and payment receipts
 */

import type { upload_document_type_enum } from "generated/prisma";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { z } from "zod";
import { notifyAdminsPaymentUploaded } from "@/entities/notification/server/finance.notifications";
import { notifyAdminsSignedFormsUploaded } from "@/entities/notification/server/form.notifications";
import { notifyResultsAvailable } from "@/entities/notification/server/sample.notifications";
import { auth } from "@/shared/server/auth";
import { db } from "@/shared/server/db";

const f = createUploadthing();

// Input schema for all booking document uploads
const bookingDocInput = z.object({
	bookingId: z.string().min(1, "Booking ID is required"),
	type: z.enum([
		"invoice",
		"service_form_signed",
		"workspace_form_signed",
		"payment_receipt",
		"sample_result",
	]),
	// For sample results, we need to know which sample this is for
	sampleTrackingId: z.string().optional(),
});

export const fileRouter = {
	/**
	 * Booking Documents Uploader
	 *
	 * Accepts PDFs (up to 16MB), images (up to 8MB), and spreadsheets (up to 10MB)
	 * Role-based permissions:
	 * - Users: service_form_signed, workspace_form_signed, payment_receipt
	 * - Admins: invoice, sample_result
	 */
	bookingDocs: f({
		pdf: { maxFileSize: "16MB", maxFileCount: 1 },
		image: { maxFileSize: "8MB", maxFileCount: 1 },
		blob: { maxFileSize: "8MB", maxFileCount: 1 }, // For xlsx, csv files
	})
		.input(bookingDocInput)
		.middleware(async ({ input }) => {
			// Get session using our auth wrapper
			const session = await auth();

			if (!session?.user?.appUserId) {
				throw new Error("Unauthorized: Please sign in to upload files");
			}

			const userId = session.user.appUserId;
			const userRole = session.user.role;
			const isAdmin = userRole === "lab_administrator";

			// Fetch the booking to verify ownership/access
			const booking = await db.bookingRequest.findUnique({
				where: { id: input.bookingId },
				select: {
					id: true,
					userId: true,
					status: true,
					referenceNumber: true,
					user: {
						select: {
							id: true,
							firstName: true,
							lastName: true,
						},
					},
				},
			});

			if (!booking) {
				throw new Error("Booking not found");
			}

			const isOwner = booking.userId === userId;

			// Role-based permission checks
			if (input.type === "invoice" || input.type === "sample_result") {
				// Only admins can upload invoices and sample results
				if (!isAdmin) {
					throw new Error(
						"Only administrators can upload invoices and sample results",
					);
				}
			} else {
				// For user documents, check ownership or admin access
				if (!isOwner && !isAdmin) {
					throw new Error(
						"You can only upload documents for your own bookings",
					);
				}
			}

			// Return metadata to be used in onUploadComplete
			return {
				userId,
				bookingId: input.bookingId,
				bookingUserId: booking.userId,
				bookingReference: booking.referenceNumber,
				customerName: `${booking.user.firstName} ${booking.user.lastName}`,
				documentType: input.type,
				sampleTrackingId: input.sampleTrackingId,
				isAdmin,
			};
		})
		.onUploadComplete(async ({ metadata, file }) => {
			// Create FileBlob record
			const blob = await db.fileBlob.create({
				data: {
					key: file.key,
					url: file.ufsUrl,
					mimeType: file.type,
					fileName: file.name,
					sizeBytes: file.size,
					uploadedById: metadata.userId,
				},
			});

			// Determine initial status based on document type
			let status: string;
			switch (metadata.documentType) {
				case "invoice":
					status = "sent";
					break;
				case "payment_receipt":
					status = "pending_verification";
					break;
				case "service_form_signed":
				case "workspace_form_signed":
					status = "uploaded";
					break;
				case "sample_result":
					status = "available";
					break;
				default:
					status = "uploaded";
			}

			// Create BookingDocument record
			const document = await db.bookingDocument.create({
				data: {
					bookingId: metadata.bookingId,
					type: metadata.documentType as upload_document_type_enum,
					blobId: blob.id,
					status,
					createdById: metadata.userId,
					note: metadata.sampleTrackingId
						? `Sample: ${metadata.sampleTrackingId}`
						: undefined,
				},
			});

			// Create audit log entry
			await db.auditLog.create({
				data: {
					userId: metadata.userId,
					action: "document_uploaded",
					entity: "BookingDocument",
					entityId: document.id,
					metadata: {
						bookingId: metadata.bookingId,
						documentType: metadata.documentType,
						fileName: file.name,
						fileSize: file.size,
						sampleTrackingId: metadata.sampleTrackingId,
					},
				},
			});

			// Send notifications based on document type
			try {
				// Get admin IDs for notifications that need to notify admins
				const getAdminIds = async () => {
					const admins = await db.user.findMany({
						where: { userType: "lab_administrator" },
						select: { id: true },
					});
					return admins.map((a) => a.id);
				};

				switch (metadata.documentType) {
					case "payment_receipt": {
						// Notify admins that payment proof was uploaded
						const adminIds = await getAdminIds();
						await notifyAdminsPaymentUploaded({
							adminIds,
							paymentId: document.id,
							bookingReference: metadata.bookingReference,
							customerName: metadata.customerName,
							amount: "Payment proof",
						});
						break;
					}

					case "service_form_signed":
					case "workspace_form_signed": {
						// Notify admins that signed forms were uploaded
						const formAdminIds = await getAdminIds();
						await notifyAdminsSignedFormsUploaded({
							adminIds: formAdminIds,
							formId: document.id,
							formNumber: metadata.bookingReference,
							bookingReference: metadata.bookingReference,
							customerName: metadata.customerName,
						});
						break;
					}

					case "sample_result": {
						// If sample tracking ID is provided, also create an AnalysisResult record
						if (metadata.sampleTrackingId) {
							const sample = await db.sampleTracking.findUnique({
								where: { id: metadata.sampleTrackingId },
								include: {
									bookingServiceItem: {
										include: {
											service: true,
											bookingRequest: true,
										},
									},
								},
							});

							if (sample) {
								// Create AnalysisResult record for backward compatibility
								await db.analysisResult.create({
									data: {
										sampleTrackingId: metadata.sampleTrackingId,
										fileName: file.name,
										filePath: file.ufsUrl,
										fileSize: file.size,
										fileType: file.type,
										uploadedBy: metadata.userId,
									},
								});

								// Notify user that results are available
								await notifyResultsAvailable({
									userId: metadata.bookingUserId,
									sampleId: metadata.sampleTrackingId,
									sampleIdentifier: sample.sampleIdentifier,
									serviceName: sample.bookingServiceItem.service.name,
									bookingReference:
										sample.bookingServiceItem.bookingRequest.referenceNumber,
									bookingId: metadata.bookingId,
								});
							}
						}
						break;
					}
				}
			} catch (notifyError) {
				// Log but don't fail - notifications are non-critical
				console.error(
					"[UploadThing] Failed to send notification:",
					notifyError,
				);
			}

			// Return data that will be available on the client
			return {
				documentId: document.id,
				blobId: blob.id,
				url: file.ufsUrl,
			};
		}),
} satisfies FileRouter;

export type OurFileRouter = typeof fileRouter;
