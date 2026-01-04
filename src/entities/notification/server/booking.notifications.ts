/**
 * Booking Notifications
 * Handles notifications for booking status transitions including completion
 */

import { db } from "@/shared/server/db";
import { sendBookingCompletedEmail } from "./email-sender";
import { enqueueInApp, markEmailSent } from "./notification-repository";

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
				userId: params.userId,
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
