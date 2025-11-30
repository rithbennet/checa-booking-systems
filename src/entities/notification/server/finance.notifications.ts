/**
 * Finance Notifications
 * Handles notifications for invoices and payments
 */

import { db } from "@/shared/server/db";
import type { notification_type_enum } from "../../../../generated/prisma";
import {
	sendAdminPaymentPendingEmail,
	sendInvoiceUploadedEmail,
	sendPaymentVerifiedEmail,
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
 * Notify user when invoice is uploaded
 */
export async function notifyInvoiceUploaded(params: {
	userId: string;
	invoiceId: string;
	invoiceNumber: string;
	amount: string;
	dueDate: string;
	bookingReference: string;
	bookingId: string;
}) {
	// Create in-app notification
	const notification = await enqueueInApp({
		userId: params.userId,
		type: "invoice_uploaded",
		relatedEntityType: "invoice",
		relatedEntityId: params.invoiceId,
		title: "Invoice Ready",
		message: `Invoice ${params.invoiceNumber} for ${params.amount} is ready. Due date: ${params.dueDate}.`,
	});

	// Send email notification
	const userDetails = await getUserEmailDetails(params.userId);
	if (userDetails) {
		const result = await sendInvoiceUploadedEmail({
			to: userDetails.email,
			customerName: userDetails.name,
			invoiceNumber: params.invoiceNumber,
			amount: params.amount,
			dueDate: params.dueDate,
			bookingReference: params.bookingReference,
			bookingId: params.bookingId,
		});
		if (result.success) {
			await markEmailSent(notification.id);
		}
	}
}

/**
 * Notify user when payment is verified
 */
export async function notifyPaymentVerified(params: {
	userId: string;
	paymentId: string;
	invoiceNumber: string;
	amount: string;
	paymentDate: string;
	bookingReference: string;
	bookingId: string;
}) {
	// Create in-app notification
	const notification = await enqueueInApp({
		userId: params.userId,
		type: "payment_verified",
		relatedEntityType: "payment",
		relatedEntityId: params.paymentId,
		title: "Payment Verified",
		message: `Your payment of ${params.amount} for invoice ${params.invoiceNumber} has been verified. Results are now available.`,
	});

	// Send email notification
	const userDetails = await getUserEmailDetails(params.userId);
	if (userDetails) {
		const result = await sendPaymentVerifiedEmail({
			to: userDetails.email,
			customerName: userDetails.name,
			invoiceNumber: params.invoiceNumber,
			amount: params.amount,
			paymentDate: params.paymentDate,
			bookingReference: params.bookingReference,
			bookingId: params.bookingId,
		});
		if (result.success) {
			await markEmailSent(notification.id);
		}
	}
}

/**
 * Send payment reminder
 */
export async function notifyPaymentReminder(params: {
	userId: string;
	invoiceId: string;
	invoiceNumber: string;
	amount: string;
	dueDate: string;
	daysOverdue: number;
}) {
	// Create in-app notification
	await enqueueInApp({
		userId: params.userId,
		type: "payment_reminder",
		relatedEntityType: "invoice",
		relatedEntityId: params.invoiceId,
		title: "Payment Reminder",
		message:
			params.daysOverdue > 0
				? `Payment for invoice ${params.invoiceNumber} (${params.amount}) is ${params.daysOverdue} day(s) overdue.`
				: `Payment for invoice ${params.invoiceNumber} (${params.amount}) is due on ${params.dueDate}.`,
	});

	// Note: Payment reminder emails could be sent here if needed
}

/**
 * Notify admins when payment proof is uploaded
 */
export async function notifyAdminsPaymentUploaded(params: {
	adminIds: string[];
	paymentId: string;
	bookingReference: string;
	customerName: string;
	amount: string;
}) {
	// Collect admin emails for batch email
	const adminEmails: string[] = [];

	for (const adminId of params.adminIds) {
		await enqueueInApp({
			userId: adminId,
			type: "payment_verified", // Using existing type
			relatedEntityType: "payment",
			relatedEntityId: params.paymentId,
			title: "Payment Proof Uploaded",
			message: `${params.customerName} has uploaded payment proof (${params.amount}) for booking ${params.bookingReference}. Please verify.`,
		});

		const adminDetails = await getUserEmailDetails(adminId);
		if (adminDetails) {
			adminEmails.push(adminDetails.email);
		}
	}

	// Send email to all admins
	if (adminEmails.length > 0) {
		await sendAdminPaymentPendingEmail({
			to: adminEmails,
			adminName: "Admin",
			referenceNumber: params.bookingReference,
			customerName: params.customerName,
		});
	}
}
