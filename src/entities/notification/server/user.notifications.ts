/**
 * User Registration and Account Notifications
 * Handles notifications for user registration, email verification, and account approval
 */

import { db } from "@/shared/server/db";
import type { notification_type_enum } from "../../../../generated/prisma";
import {
	sendAccountRejectedEmail,
	sendAccountSuspendedEmail,
	sendAccountVerifiedEmail,
	sendAdminNewUserRegisteredEmail,
	sendWelcomeVerificationEmail,
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
 * Send welcome verification email to new user
 * Called during registration - does NOT create in-app notification yet
 */
export async function sendUserWelcomeVerification(params: {
	email: string;
	name: string;
	verificationUrl: string;
}) {
	return sendWelcomeVerificationEmail({
		to: params.email,
		customerName: params.name,
		verificationUrl: params.verificationUrl,
	});
}

/**
 * Notify admins when a new user completes email verification
 * Creates in-app notifications for admins and sends email
 */
export async function notifyAdminsNewUserRegistered(params: {
	adminIds: string[];
	userId: string;
	userName: string;
	userEmail: string;
	userType: string;
}) {
	// Collect admin emails for batch email
	const adminEmails: string[] = [];

	const userTypeLabel =
		params.userType === "utm_member"
			? "UTM Member"
			: params.userType === "external_member"
				? "External Member"
				: "Lab Administrator";

	for (const adminId of params.adminIds) {
		await enqueueInApp({
			userId: adminId,
			type: "booking_submitted", // Reusing existing type
			relatedEntityType: "user",
			relatedEntityId: params.userId,
			title: "New User Registration",
			message: `${params.userName} (${params.userEmail}) has registered as ${userTypeLabel}. Please review and approve.`,
		});

		const adminDetails = await getUserEmailDetails(adminId);
		if (adminDetails) {
			adminEmails.push(adminDetails.email);
		}
	}

	// Send email to all admins
	if (adminEmails.length > 0) {
		await sendAdminNewUserRegisteredEmail({
			to: adminEmails,
			adminName: "Admin",
			customerName: params.userName,
			customerEmail: params.userEmail,
			userType: userTypeLabel,
		});
	}
}

/**
 * Notify user when their account is approved
 */
export async function notifyUserAccountApproved(params: { userId: string }) {
	const userDetails = await getUserEmailDetails(params.userId);
	if (!userDetails) return;

	// Create in-app notification
	await enqueueInApp({
		userId: params.userId,
		type: "booking_approved", // Reusing existing type
		relatedEntityType: "user",
		relatedEntityId: params.userId,
		title: "Account Approved",
		message:
			"Your ChECA Lab account has been approved. You can now access all features.",
	});

	// Send email
	await sendAccountVerifiedEmail({
		to: userDetails.email,
		customerName: userDetails.name,
	});
}

/**
 * Notify user when their account is rejected
 */
export async function notifyUserAccountRejected(params: {
	userId: string;
	reason?: string;
}) {
	const userDetails = await getUserEmailDetails(params.userId);
	if (!userDetails) return;

	// Create in-app notification
	await enqueueInApp({
		userId: params.userId,
		type: "booking_rejected", // Reusing existing type
		relatedEntityType: "user",
		relatedEntityId: params.userId,
		title: "Account Not Approved",
		message: params.reason
			? `Your account registration was not approved. Reason: ${params.reason}`
			: "Your account registration was not approved. Please contact support for more information.",
	});

	// Send email
	await sendAccountRejectedEmail({
		to: userDetails.email,
		customerName: userDetails.name,
		reason: params.reason,
	});
}

/**
 * Notify user when their account is suspended or deactivated
 */
export async function notifyUserAccountStatusChanged(params: {
	userId: string;
	status: "suspended" | "inactive";
	reason?: string;
}) {
	const userDetails = await getUserEmailDetails(params.userId);
	if (!userDetails) return;

	const statusLabel =
		params.status === "suspended" ? "Suspended" : "Deactivated";

	// Create in-app notification
	await enqueueInApp({
		userId: params.userId,
		type: "booking_rejected", // Reusing existing type
		relatedEntityType: "user",
		relatedEntityId: params.userId,
		title: `Account ${statusLabel}`,
		message: params.reason
			? `Your account has been ${params.status}. Reason: ${params.reason}`
			: `Your account has been ${params.status}. Please contact support for more information.`,
	});

	// Send email
	await sendAccountSuspendedEmail({
		to: userDetails.email,
		customerName: userDetails.name,
		status: params.status,
		reason: params.reason,
	});
}
