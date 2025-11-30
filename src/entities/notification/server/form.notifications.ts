/**
 * Service Form Notifications
 * Handles notifications for service form generation and signing
 */

import { db } from "@/shared/server/db";
import type { notification_type_enum } from "../../../../generated/prisma";
import {
	sendAdminSignedFormsUploadedEmail,
	sendServiceFormReadyEmail,
} from "./email-sender";

/**
 * Get user details for email
 */
async function getUserEmailDetails(userId: string) {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { email: true, firstName: true, lastName: true },
	});
	return user
		? { email: user.email, name: `${user.firstName} ${user.lastName}` }
		: null;
}

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
 * Mark notification as email sent
 */
async function markEmailSent(notificationId: string) {
	return db.notification.update({
		where: { id: notificationId },
		data: { emailSent: true, emailSentAt: new Date() },
	});
}

/**
 * Notify user when service form is ready for download
 */
export async function notifyServiceFormReady(params: {
	userId: string;
	formId: string;
	formNumber: string;
	bookingReference: string;
	bookingId: string;
	validUntil: string;
	requiresWorkingAreaAgreement: boolean;
}) {
	// Create in-app notification
	const notification = await enqueueInApp({
		userId: params.userId,
		type: "service_form_ready",
		relatedEntityType: "booking",
		relatedEntityId: params.bookingId,
		title: "Service Form Ready",
		message: `Service form ${params.formNumber} is ready for download. Valid until ${params.validUntil}.`,
	});

	// Send email notification
	const userDetails = await getUserEmailDetails(params.userId);
	if (userDetails) {
		const result = await sendServiceFormReadyEmail({
			to: userDetails.email,
			customerName: userDetails.name,
			formNumber: params.formNumber,
			bookingReference: params.bookingReference,
			validUntil: params.validUntil,
			requiresWorkingAreaAgreement: params.requiresWorkingAreaAgreement,
			bookingId: params.bookingId,
		});
		if (result.success) {
			await markEmailSent(notification.id);
		}
	}
}

/**
 * Notify admins when signed forms are uploaded
 */
export async function notifyAdminsSignedFormsUploaded(params: {
	adminIds: string[];
	formId: string;
	formNumber: string;
	bookingReference: string;
	customerName: string;
}) {
	// Collect admin emails for batch email
	const adminEmails: string[] = [];

	for (const adminId of params.adminIds) {
		await enqueueInApp({
			userId: adminId,
			type: "forms_signed_uploaded",
			relatedEntityType: "booking",
			relatedEntityId: params.formId,
			title: "Signed Forms Uploaded",
			message: `${params.customerName} has uploaded signed forms for ${params.bookingReference}. Please proceed with invoicing.`,
		});

		const adminDetails = await getUserEmailDetails(adminId);
		if (adminDetails) {
			adminEmails.push(adminDetails.email);
		}
	}

	// Send email to all admins
	if (adminEmails.length > 0) {
		await sendAdminSignedFormsUploadedEmail({
			to: adminEmails,
			adminName: "Admin",
			referenceNumber: params.bookingReference,
			customerName: params.customerName,
		});
	}
}

/**
 * Notify user that process is complete
 */
export async function notifyProcessComplete(params: {
	userId: string;
	bookingId: string;
	bookingReference: string;
}) {
	await enqueueInApp({
		userId: params.userId,
		type: "process_complete",
		relatedEntityType: "booking",
		relatedEntityId: params.bookingId,
		title: "Process Complete",
		message: `All processes for booking ${params.bookingReference} have been completed. Thank you for using ChECA Lab.`,
	});
}
