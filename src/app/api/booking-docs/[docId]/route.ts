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

	// Check if this is a form document that might orphan a ServiceForm
	const isFormDocument =
		document.type === "service_form_unsigned" ||
		document.type === "workspace_form_unsigned";
	const documentUrl = document.blob.url;

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

		// If this was a form document, check for orphaned ServiceForms
		if (isFormDocument) {
			// Find forms that reference this document URL
			const formsToCheck = await tx.serviceForm.findMany({
				where: {
					bookingRequestId: document.bookingId,
					OR: [
						{ serviceFormUnsignedPdfPath: documentUrl },
						{ workingAreaAgreementUnsignedPdfPath: documentUrl },
					],
				},
				select: {
					id: true,
					formNumber: true,
					serviceFormUnsignedPdfPath: true,
					requiresWorkingAreaAgreement: true,
					workingAreaAgreementUnsignedPdfPath: true,
				},
			});

			// Fetch all bookingDocuments for this booking once (avoiding N+1 queries)
			const allBookingDocuments = await tx.bookingDocument.findMany({
				where: {
					bookingId: document.bookingId,
					type: {
						in: ["service_form_unsigned", "workspace_form_unsigned"],
					},
				},
				include: {
					blob: true,
				},
			});

			// Build lookup sets keyed by blob.url for O(1) checks
			const serviceFormUrls = new Set<string>();
			const workspaceFormUrls = new Set<string>();

			for (const doc of allBookingDocuments) {
				if (doc.blob.url) {
					if (doc.type === "service_form_unsigned") {
						serviceFormUrls.add(doc.blob.url);
					} else if (doc.type === "workspace_form_unsigned") {
						workspaceFormUrls.add(doc.blob.url);
					}
				}
			}

			// For each form, check if all required documents still exist
			for (const form of formsToCheck) {
				// Check if serviceFormUnsignedPdfPath is null/undefined before querying
				if (!form.serviceFormUnsignedPdfPath) {
					// Form has no service form path - delete it as orphaned
					await tx.serviceForm.delete({
						where: { id: form.id },
					});
					// Create audit log entry within the same transaction
					await tx.auditLog.create({
						data: {
							userId: user.id,
							action: "form_deleted_orphaned",
							entity: "ServiceForm",
							entityId: form.id,
							metadata: {
								bookingId: document.bookingId,
								formNumber: form.formNumber,
								reason: "Associated document deleted",
								documentType: document.type,
							},
						},
					});
					continue;
				}

				// Check if service_form_unsigned document still exists using in-memory lookup
				const hasServiceFormDoc = serviceFormUrls.has(
					form.serviceFormUnsignedPdfPath,
				);

				// If service form doc is missing, form is orphaned
				if (!hasServiceFormDoc) {
					// Delete the orphaned form
					await tx.serviceForm.delete({
						where: { id: form.id },
					});
					// Create audit log entry within the same transaction
					await tx.auditLog.create({
						data: {
							userId: user.id,
							action: "form_deleted_orphaned",
							entity: "ServiceForm",
							entityId: form.id,
							metadata: {
								bookingId: document.bookingId,
								formNumber: form.formNumber,
								reason: "Associated document deleted",
								documentType: document.type,
							},
						},
					});
					continue;
				}

				// If form requires working area agreement, check if that doc exists
				if (form.requiresWorkingAreaAgreement) {
					if (!form.workingAreaAgreementUnsignedPdfPath) {
						// Form requires WA but doesn't have path - delete it
						await tx.serviceForm.delete({
							where: { id: form.id },
						});
						// Create audit log entry within the same transaction
						await tx.auditLog.create({
							data: {
								userId: user.id,
								action: "form_deleted_orphaned",
								entity: "ServiceForm",
								entityId: form.id,
								metadata: {
									bookingId: document.bookingId,
									formNumber: form.formNumber,
									reason: "Associated document deleted",
									documentType: document.type,
								},
							},
						});
						continue;
					}

					// Check if workspace form doc exists using in-memory lookup
					const hasWorkspaceFormDoc = workspaceFormUrls.has(
						form.workingAreaAgreementUnsignedPdfPath,
					);

					// If workspace form doc is missing, form is orphaned
					if (!hasWorkspaceFormDoc) {
						await tx.serviceForm.delete({
							where: { id: form.id },
						});
						// Create audit log entry within the same transaction
						await tx.auditLog.create({
							data: {
								userId: user.id,
								action: "form_deleted_orphaned",
								entity: "ServiceForm",
								entityId: form.id,
								metadata: {
									bookingId: document.bookingId,
									formNumber: form.formNumber,
									reason: "Associated document deleted",
									documentType: document.type,
								},
							},
						});
					}
				}
			}
		}
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
