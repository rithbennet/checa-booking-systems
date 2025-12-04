/**
 * Document Verification Notifications
 * Handles notifications for document verification (signed forms, payment receipts)
 */

import type {
	notification_type_enum,
	upload_document_type_enum,
} from "generated/prisma";
import { getDocumentTypeLabel } from "@/entities/booking-document";
import { db } from "@/shared/server/db";

/**
 * Enqueue an in-app notification
 */
async function enqueueInApp(params: {
	userId: string;
	type: notification_type_enum;
	relatedEntityType: string;
	relatedEntityId: string;
	title: string;
	message: string;
}) {
	return db.notification.create({
		data: {
			userId: params.userId,
			type: params.type,
			relatedEntityType: params.relatedEntityType,
			relatedEntityId: params.relatedEntityId,
			title: params.title,
			message: params.message,
			emailSent: false,
		},
	});
}

/**
 * Map document type to notification type
 */
function getNotificationType(
	documentType: upload_document_type_enum,
): notification_type_enum {
	switch (documentType) {
		case "service_form_signed":
		case "workspace_form_signed":
			return "forms_signed_uploaded"; // Using existing type for signed forms verification
		case "payment_receipt":
			return "payment_verified";
		default:
			return "process_complete"; // Fallback
	}
}

/**
 * Get notification title based on document type
 */
function getNotificationTitle(documentType: upload_document_type_enum): string {
	switch (documentType) {
		case "service_form_signed":
			return "Service Form Verified";
		case "workspace_form_signed":
			return "Working Area Agreement Verified";
		case "payment_receipt":
			return "Payment Verified";
		default:
			return "Document Verified";
	}
}

/**
 * Notify user when their uploaded document is verified by admin
 */
export async function sendDocumentVerifiedNotification(params: {
	userId: string;
	bookingId: string;
	bookingReference: string;
	documentType: upload_document_type_enum;
}) {
	const notificationType = getNotificationType(params.documentType);
	const title = getNotificationTitle(params.documentType);
	const documentLabel = getDocumentTypeLabel(params.documentType);

	const message = `Your ${documentLabel} for booking ${params.bookingReference} has been verified.`;

	// Create in-app notification
	await enqueueInApp({
		userId: params.userId,
		type: notificationType,
		relatedEntityType: "booking",
		relatedEntityId: params.bookingId,
		title,
		message,
	});

	// TODO: Send email notification
	// For now, we just create the in-app notification
	// const userDetails = await getUserEmailDetails(params.userId);
	// if (userDetails) {
	//   await sendDocumentVerifiedEmail({ ... });
	// }

	return { success: true };
}

/**
 * Notify user when their uploaded document is rejected by admin
 */
export async function sendDocumentRejectedNotification(params: {
	userId: string;
	bookingId: string;
	bookingReference: string;
	documentType: upload_document_type_enum;
	rejectionReason: string;
}) {
	const documentLabel = getDocumentTypeLabel(params.documentType);
	const title = `${documentLabel} Rejected`;
	const message = `Your ${documentLabel} for booking ${params.bookingReference} was rejected. Reason: ${params.rejectionReason}. Please upload a new document.`;

	// Create in-app notification
	await enqueueInApp({
		userId: params.userId,
		type: "process_complete", // Using generic type for rejections
		relatedEntityType: "booking",
		relatedEntityId: params.bookingId,
		title,
		message,
	});

	return { success: true };
}
