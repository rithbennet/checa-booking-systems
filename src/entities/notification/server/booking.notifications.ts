/**
 * Booking Notifications
 * Handles notifications for booking status transitions including completion
 */

import type { notification_type_enum } from "generated/prisma";
import { db } from "@/shared/server/db";
import { sendBookingCompletedEmail } from "./email-sender";

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
 * Notify user that booking is completed - all results ready
 *
 * This fires ONCE per booking, only on the transition from non-completed → completed.
 */
export async function notifyBookingCompleted(params: {
	userId: string;
	bookingId: string;
	bookingReference: string;
}) {
	// Create in-app notification
	const notification = await enqueueInApp({
		userId: params.userId,
		type: "process_complete",
		relatedEntityType: "booking",
		relatedEntityId: params.bookingId,
		title: "Booking Completed",
		message: `All results for booking ${params.bookingReference} are ready. You can now view and download your results.`,
	});

	// Send email notification
	const userDetails = await getUserEmailDetails(params.userId);
	if (userDetails) {
		try {
			const result = await sendBookingCompletedEmail({
				to: userDetails.email,
				customerName: userDetails.name,
				bookingReference: params.bookingReference,
				bookingId: params.bookingId,
			});
			if (result.success) {
				await markEmailSent(notification.id);
			}
		} catch (emailError) {
			// Log but don't fail - email is non-critical
			console.error(
				"[notifyBookingCompleted] Failed to send email:",
				emailError,
			);
		}
	}

	return notification;
}
