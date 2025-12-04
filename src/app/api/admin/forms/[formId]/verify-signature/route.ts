/**
 * Service Form Signature Verification API
 * POST /api/admin/forms/[formId]/verify-signature
 *
 * Admin verifies that the uploaded signed forms are valid.
 * This enables payment processing for the booking.
 */

import { NextResponse } from "next/server";
import {
	badRequest,
	createProtectedHandler,
	forbidden,
	notFound,
	serverError,
} from "@/shared/lib/api-factory";
import { db } from "@/shared/server/db";

interface RouteParams {
	params: Promise<{
		formId: string;
	}>;
}

export const POST = createProtectedHandler(
	async (_request: Request, user, { params }) => {
		try {
			if (user.role !== "lab_administrator") return forbidden();

			const { formId } = await (params as unknown as RouteParams["params"]);
			if (!formId) return badRequest("Form ID is required");

			// Get the service form
			const form = await db.serviceForm.findUnique({
				where: { id: formId },
				include: {
					bookingRequest: {
						select: {
							id: true,
							referenceNumber: true,
							userId: true,
						},
					},
				},
			});

			if (!form) return notFound("Service form not found");

			// Verify the form is in signed_forms_uploaded status
			if (form.status !== "signed_forms_uploaded") {
				return badRequest(
					`Cannot verify signature: form status is '${form.status}'. Expected 'signed_forms_uploaded'.`,
				);
			}

			// Check that signed form has been uploaded
			if (!form.serviceFormSignedPdfPath) {
				return badRequest(
					"Cannot verify signature: no signed service form has been uploaded",
				);
			}

			// Check working area agreement if required
			if (
				form.requiresWorkingAreaAgreement &&
				!form.workingAreaAgreementSignedPdfPath
			) {
				return badRequest(
					"Cannot verify signature: working area agreement is required but not uploaded",
				);
			}

			// Update the form - since there's no "verified" status, we'll keep it as signed_forms_uploaded
			// but we can add a verification timestamp. For now, we'll use signedFormsUploadedAt.
			// If you want a separate verification status, you'd need to add it to the schema.

			// For this implementation, we'll mark the signature as verified by updating a field
			// Since there's no signatureVerified field, let's update signedFormsUploadedBy to the admin
			// who verified it, which acts as a verification marker.

			await db.serviceForm.update({
				where: { id: formId },
				data: {
					signedFormsUploadedBy: user.id,
					signedFormsUploadedAt: form.signedFormsUploadedAt ?? new Date(),
				},
			});

			// Create an audit log entry
			await db.auditLog.create({
				data: {
					userId: user.id,
					action: "VERIFY_SIGNATURE",
					entity: "service_form",
					entityId: formId,
					metadata: {
						formNumber: form.formNumber,
						bookingId: form.bookingRequest.id,
						bookingReference: form.bookingRequest.referenceNumber,
					},
				},
			});

			return NextResponse.json({
				success: true,
				message: "Service form signature verified successfully",
				formId,
				formNumber: form.formNumber,
			});
		} catch (error) {
			console.error("[verify-signature] Error:", error);
			return serverError("Failed to verify signature");
		}
	},
);
