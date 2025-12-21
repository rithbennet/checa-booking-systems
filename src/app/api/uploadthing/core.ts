/**
 * UploadThing File Router
 *
 * Handles file uploads for:
 * - Booking documents: Admin uploads invoice PDFs, sample results; Users upload signed service forms, workspace forms, and payment receipts
 * - Profile images: Users upload their profile pictures
 */

import type {
	document_verification_status_enum,
	upload_document_type_enum,
} from "generated/prisma";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { z } from "zod";
import { notifyAdminsPaymentUploaded } from "@/entities/notification/server/finance.notifications";
import { notifyAdminsSignedFormsUploaded } from "@/entities/notification/server/form.notifications";
import { notifyResultsAvailable } from "@/entities/notification/server/sample.notifications";
import { auth } from "@/shared/server/auth";
import { db } from "@/shared/server/db";
import { utapi } from "@/shared/server/uploadthing";

const f = createUploadthing();

/**
 * Helper to get or create the default FacilityDocumentConfig and return its id.
 * Used by signature and logo upload handlers for audit logging.
 */
async function getOrCreateFacilityConfigId(): Promise<string> {
	// Use a single atomic upsert to avoid TOCTOU races when concurrent
	// requests try to create the singleton record.
	const res = await db.facilityDocumentConfig.upsert({
		where: { singletonKey: "default" },
		create: {
			singletonKey: "default",
			facilityName: "Default Facility",
			addressTitle: "",
			addressInstitute: "",
			addressUniversity: "",
			addressStreet: "",
			addressCity: "",
			addressEmail: "",
			staffPicName: "",
			staffPicFullName: "",
			staffPicEmail: "",
			staffPicPhone: null,
			staffPicTitle: null,
			staffPicSignatureBlobId: null,
			ikohzaHeadName: "",
			ikohzaHeadTitle: null,
			ikohzaHeadDepartment: "",
			ikohzaHeadInstitute: "",
			ikohzaHeadUniversity: "",
			ikohzaHeadAddress: "",
			ikohzaHeadSignatureBlobId: null,
			ccRecipients: [],
			facilities: [],
		},
		// Perform a harmless update to ensure the upsert has an update branch
		// when the record already exists. `updatedAt` is safe to touch.
		update: { updatedAt: new Date() },
		select: { id: true },
	});
	return res.id;
}

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
	 * Accepts PDFs (up to 16MB), images (up to 8MB), and spreadsheets/text (up to 10MB)
	 * Role-based permissions:
	 * - Users: service_form_signed, workspace_form_signed, payment_receipt
	 * - Admins: invoice, sample_result
	 */
	bookingDocs: f({
		pdf: { maxFileSize: "16MB", maxFileCount: 10 },
		image: { maxFileSize: "8MB", maxFileCount: 10 },
		blob: { maxFileSize: "8MB", maxFileCount: 10 }, // For xlsx, csv, txt files
		text: { maxFileSize: "8MB", maxFileCount: 10 }, // For txt files
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

			// Determine initial verification status based on document type
			// - Admin-generated docs (invoice) start as not_required (no verification needed)
			// - User-uploaded docs requiring verification start as pending_verification
			// - Service/workspace forms need to be uploaded, so start as pending_verification
			let verificationStatus: document_verification_status_enum;
			switch (metadata.documentType) {
				case "invoice":
					// Invoices are admin-generated and don't need verification
					verificationStatus = "not_required";
					break;
				case "payment_receipt":
					// Payment receipts need admin verification
					verificationStatus = "pending_verification";
					break;
				case "service_form_signed":
				case "workspace_form_signed":
					// Signed forms need admin verification
					verificationStatus = "pending_verification";
					break;
				case "sample_result":
					// Results are admin-uploaded and don't need verification
					verificationStatus = "not_required";
					break;
				default:
					verificationStatus = "pending_verification";
			}

			// Create BookingDocument record
			const document = await db.bookingDocument.create({
				data: {
					bookingId: metadata.bookingId,
					type: metadata.documentType as upload_document_type_enum,
					blobId: blob.id,
					verificationStatus,
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
				// Get admin IDs and emails for notifications that need to notify admins
				// Query directly from User model per Prisma schema: email field is on User model
				const getAdminIds = async () => {
					const admins = await db.user.findMany({
						where: { userType: "lab_administrator", status: "active" },
						select: { id: true, email: true },
					});
					return admins.map((a) => a.id);
				};

				switch (metadata.documentType) {
					case "payment_receipt": {
						// Notify admins that payment proof was uploaded
						const adminIds = await getAdminIds();
						try {
							await notifyAdminsPaymentUploaded({
								adminIds,
								paymentId: document.id,
								bookingReference: metadata.bookingReference,
								customerName: metadata.customerName,
								amount: "Payment proof",
							});
						} catch (notifyError) {
							console.error(
								"[UploadThing] Failed to notify admins of payment upload:",
								notifyError,
							);
						}
						break;
					}

					case "service_form_signed":
					case "workspace_form_signed": {
						// Notify admins that signed forms were uploaded
						const formAdminIds = await getAdminIds();
						try {
							await notifyAdminsSignedFormsUploaded({
								adminIds: formAdminIds,
								formId: document.id,
								formNumber: metadata.bookingReference,
								bookingReference: metadata.bookingReference,
								customerName: metadata.customerName,
							});
						} catch (notifyError) {
							console.error(
								"[UploadThing] Failed to notify admins of signed forms upload:",
								notifyError,
							);
						}
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

	/**
	 * Profile Image Uploader
	 *
	 * Accepts images (up to 2MB) for user profile pictures
	 * Users can only upload their own profile image
	 */
	profileImage: f({
		image: { maxFileSize: "2MB", maxFileCount: 1 },
	})
		.middleware(async () => {
			// Get session using our auth wrapper
			const session = await auth();

			if (!session?.user?.appUserId) {
				throw new Error("Unauthorized: Please sign in to upload profile image");
			}

			const userId = session.user.appUserId;

			// Return metadata to be used in onUploadComplete
			return {
				userId,
			};
		})
		.onUploadComplete(async ({ metadata, file }) => {
			// Get current user to check for existing profile image
			const currentUser = await db.user.findUnique({
				where: { id: metadata.userId },
				select: { profileImageUrl: true },
			});

			// Delete old profile image if it exists and is an UploadThing URL
			if (currentUser?.profileImageUrl) {
				try {
					// Find FileBlob with the old URL
					const oldBlob = await db.fileBlob.findFirst({
						where: { url: currentUser.profileImageUrl },
					});

					if (oldBlob) {
						// Delete from UploadThing storage
						await utapi.deleteFiles(oldBlob.key);
						// Delete FileBlob record
						await db.fileBlob.delete({ where: { id: oldBlob.id } });
					}
				} catch (error) {
					// Log but don't fail - old image deletion is not critical
					console.error("Failed to delete old profile image:", error);
				}
			}

			// Create FileBlob record and update user's profile image URL atomically
			const blob = await db.$transaction(async (tx) => {
				// Create FileBlob record for new image
				const createdBlob = await tx.fileBlob.create({
					data: {
						key: file.key,
						url: file.ufsUrl,
						mimeType: file.type,
						fileName: file.name,
						sizeBytes: file.size,
						uploadedById: metadata.userId,
					},
				});

				// Update user's profile image URL
				await tx.user.update({
					where: { id: metadata.userId },
					data: {
						profileImageUrl: file.ufsUrl,
						updatedAt: new Date(),
					},
				});

				return createdBlob;
			});

			// Create audit log entry
			await db.auditLog.create({
				data: {
					userId: metadata.userId,
					action: "profile_image_uploaded",
					entity: "User",
					entityId: metadata.userId,
					metadata: {
						fileName: file.name,
						fileSize: file.size,
						url: file.ufsUrl,
					},
				},
			});

			// Return data that will be available on the client
			return {
				url: file.ufsUrl,
				blobId: blob.id,
			};
		}),

	/**
	 * Signature Image Uploader
	 *
	 * Accepts images (up to 2MB) for system signature images (PIC and Ikohza head)
	 * Only administrators can upload signature images
	 */
	signatureImage: f({
		image: { maxFileSize: "2MB", maxFileCount: 1 },
	})
		.middleware(async () => {
			// Get session using our auth wrapper
			const session = await auth();

			if (!session?.user?.appUserId) {
				throw new Error(
					"Unauthorized: Please sign in to upload signature image",
				);
			}

			const userId = session.user.appUserId;
			const userRole = session.user.role;
			const isAdmin = userRole === "lab_administrator";

			if (!isAdmin) {
				throw new Error(
					"Forbidden: Only administrators can upload signature images",
				);
			}

			// Return metadata to be used in onUploadComplete
			return {
				userId,
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

			// Get or create the FacilityDocumentConfig record for entityId reference
			const facilityConfigId = await getOrCreateFacilityConfigId();

			// Create audit log entry with entityId
			await db.auditLog.create({
				data: {
					userId: metadata.userId,
					action: "system_signature_uploaded",
					entity: "FacilityDocumentConfig",
					entityId: facilityConfigId,
					metadata: {
						fileName: file.name,
						fileSize: file.size,
						url: file.ufsUrl,
						blobId: blob.id,
					},
				},
			});

			// Return data that will be available on the client
			return {
				url: file.ufsUrl,
				blobId: blob.id,
			};
		}),

	/**
	 * Logo Image Uploader
	 *
	 * Accepts images (up to 2MB) for system logos (main and big logos)
	 * Only administrators can upload logo images
	 */
	logoImage: f({
		image: { maxFileSize: "2MB", maxFileCount: 1 },
	})
		.middleware(async () => {
			// Get session using our auth wrapper
			const session = await auth();

			if (!session?.user?.appUserId) {
				throw new Error("Unauthorized: Please sign in to upload logo image");
			}

			const userId = session.user.appUserId;
			const userRole = session.user.role;
			const isAdmin = userRole === "lab_administrator";

			if (!isAdmin) {
				throw new Error(
					"Forbidden: Only administrators can upload logo images",
				);
			}

			// Return metadata to be used in onUploadComplete
			return {
				userId,
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

			// Get the FacilityDocumentConfig record for entityId reference
			const facilityConfig = await db.facilityDocumentConfig.findUnique({
				where: { singletonKey: "default" },
				select: { id: true },
			});

			// Create audit log entry with entityId
			await db.auditLog.create({
				data: {
					userId: metadata.userId,
					action: "system_logo_uploaded",
					entity: "FacilityDocumentConfig",
					entityId: facilityConfig?.id,
					metadata: {
						fileName: file.name,
						fileSize: file.size,
						url: file.ufsUrl,
						blobId: blob.id,
					},
				},
			});

			// Return data that will be available on the client
			return {
				url: file.ufsUrl,
				blobId: blob.id,
			};
		}),
} satisfies FileRouter;

export type OurFileRouter = typeof fileRouter;
