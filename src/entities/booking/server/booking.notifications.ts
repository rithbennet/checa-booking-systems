import {
	sendAccountVerifiedEmail,
	sendAdminNewBookingEmail,
	sendAdminUserVerifiedEmail,
	sendBookingApprovedEmail,
	sendBookingRejectedEmail,
	sendBookingRevisionRequestedEmail,
	sendBookingSubmittedEmail,
} from "@/entities/notification/server/email-sender";
import {
	enqueueInApp,
	markEmailSent,
} from "@/entities/notification/server/notification-repository";
import { db } from "@/shared/server/db";

/**
 * Notification adapter for booking events
 * Implements both in-app notifications (database) and email notifications (Resend)
 */

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
 * Notify user on booking submission
 */
export async function notifyUserBookingSubmitted(params: {
	userId: string;
	bookingId: string;
	referenceNumber: string;
	status: "pending_approval" | "pending_user_verification";
}) {
	const statusMessage =
		params.status === "pending_approval"
			? "Your booking is now pending admin approval."
			: "Your booking is pending account verification. Once your account is verified, it will be reviewed by administrators.";

	// Create in-app notification
	const notification = await enqueueInApp({
		userId: params.userId,
		type: "booking_submitted",
		relatedEntityType: "booking",
		relatedEntityId: params.bookingId,
		title: "Booking Submitted",
		message: `Your booking ${params.referenceNumber} has been submitted. ${statusMessage}`,
	});

	// Send email notification
	const userDetails = await getUserEmailDetails(params.userId);
	if (userDetails) {
		const result = await sendBookingSubmittedEmail({
			to: userDetails.email,
			customerName: userDetails.name,
			referenceNumber: params.referenceNumber,
			status: params.status,
		});
		if (result.success) {
			await markEmailSent(notification.id);
		}
	}
}

/**
 * Notify admins of new booking
 */
export async function notifyAdminsNewBooking(params: {
	adminIds: string[];
	bookingId: string;
	referenceNumber: string;
	status: "pending_approval" | "pending_user_verification";
	customerName?: string;
	customerEmail?: string;
}) {
	const type =
		params.status === "pending_user_verification"
			? "booking_pending_verification"
			: "booking_submitted";

	const message =
		params.status === "pending_user_verification"
			? `Booking ${params.referenceNumber} is pending user verification.`
			: `New booking ${params.referenceNumber} is pending your approval.`;

	// Collect admin emails for batch email
	const adminEmails: string[] = [];

	for (const adminId of params.adminIds) {
		await enqueueInApp({
			userId: adminId,
			type,
			relatedEntityType: "booking",
			relatedEntityId: params.bookingId,
			title: "New Booking Submitted",
			message,
		});

		const adminDetails = await getUserEmailDetails(adminId);
		if (adminDetails) {
			adminEmails.push(adminDetails.email);
		}
	}

	// Send email to all admins
	if (adminEmails.length > 0 && params.customerName && params.customerEmail) {
		await sendAdminNewBookingEmail({
			to: adminEmails,
			adminName: "Admin",
			referenceNumber: params.referenceNumber,
			customerName: params.customerName,
			customerEmail: params.customerEmail,
		});
	}
}

/**
 * Notify user of booking approval
 */
export async function notifyUserBookingApproved(params: {
	userId: string;
	bookingId: string;
	referenceNumber: string;
}) {
	const notification = await enqueueInApp({
		userId: params.userId,
		type: "booking_approved",
		relatedEntityType: "booking",
		relatedEntityId: params.bookingId,
		title: "Booking Approved",
		message: `Your booking ${params.referenceNumber} has been approved by the administrator.`,
	});

	// Send email notification
	const userDetails = await getUserEmailDetails(params.userId);
	if (userDetails) {
		const result = await sendBookingApprovedEmail({
			to: userDetails.email,
			customerName: userDetails.name,
			referenceNumber: params.referenceNumber,
			bookingId: params.bookingId,
		});
		if (result.success) {
			await markEmailSent(notification.id);
		}
	}
}

/**
 * Notify user of booking rejection
 */
export async function notifyUserBookingRejected(params: {
	userId: string;
	bookingId: string;
	referenceNumber: string;
	note: string;
}) {
	const notification = await enqueueInApp({
		userId: params.userId,
		type: "booking_rejected",
		relatedEntityType: "booking",
		relatedEntityId: params.bookingId,
		title: "Booking Rejected",
		message: `Your booking ${params.referenceNumber} has been rejected. Admin notes: ${params.note}`,
	});

	// Send email notification
	const userDetails = await getUserEmailDetails(params.userId);
	if (userDetails) {
		const result = await sendBookingRejectedEmail({
			to: userDetails.email,
			customerName: userDetails.name,
			referenceNumber: params.referenceNumber,
			reason: params.note,
			bookingId: params.bookingId,
		});
		if (result.success) {
			await markEmailSent(notification.id);
		}
	}
}

/**
 * Notify user of booking returned for edit
 */
export async function notifyUserBookingReturnedForEdit(params: {
	userId: string;
	bookingId: string;
	referenceNumber: string;
	note: string;
}) {
	const notification = await enqueueInApp({
		userId: params.userId,
		type: "booking_submitted",
		relatedEntityType: "booking",
		relatedEntityId: params.bookingId,
		title: "Booking Returned for Edit",
		message: `Your booking ${params.referenceNumber} has been returned for editing. Admin notes: ${params.note}`,
	});

	// Send email notification
	const userDetails = await getUserEmailDetails(params.userId);
	if (userDetails) {
		const result = await sendBookingRevisionRequestedEmail({
			to: userDetails.email,
			customerName: userDetails.name,
			referenceNumber: params.referenceNumber,
			adminNotes: params.note,
			bookingId: params.bookingId,
		});
		if (result.success) {
			await markEmailSent(notification.id);
		}
	}
}

/**
 * Notify user of account verification
 */
export async function notifyUserAccountVerified(params: {
	userId: string;
	userEmail: string;
}) {
	const notification = await enqueueInApp({
		userId: params.userId,
		type: "booking_submitted",
		relatedEntityType: "user",
		relatedEntityId: params.userId,
		title: "Account Verified",
		message:
			"Your account has been verified. Any pending bookings will now be reviewed by administrators.",
	});

	// Send email notification
	const userDetails = await getUserEmailDetails(params.userId);
	if (userDetails) {
		const result = await sendAccountVerifiedEmail({
			to: userDetails.email,
			customerName: userDetails.name,
		});
		if (result.success) {
			await markEmailSent(notification.id);
		}
	}
}

/**
 * Notify admins that user has been verified and bookings moved to pending_approval
 */
export async function notifyAdminsUserVerified(params: {
	adminIds: string[];
	userId: string;
	userEmail: string;
	bookingCount: number;
}) {
	// Collect admin emails for batch email
	const adminEmails: string[] = [];

	for (const adminId of params.adminIds) {
		await enqueueInApp({
			userId: adminId,
			type: "booking_submitted",
			relatedEntityType: "user",
			relatedEntityId: params.userId,
			title: "User Account Verified",
			message: `User ${params.userEmail} has been verified. ${params.bookingCount} booking(s) moved to pending approval.`,
		});

		const adminDetails = await getUserEmailDetails(adminId);
		if (adminDetails) {
			adminEmails.push(adminDetails.email);
		}
	}

	// Send email to all admins
	if (adminEmails.length > 0) {
		await sendAdminUserVerifiedEmail({
			to: adminEmails,
			adminName: "Admin",
			customerEmail: params.userEmail,
			bookingCount: params.bookingCount,
		});
	}
}
