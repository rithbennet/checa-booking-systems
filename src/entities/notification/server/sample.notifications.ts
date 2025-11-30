/**
 * Sample Tracking Notifications
 * Handles notifications for sample status changes
 */

import { db } from "@/shared/server/db";
import type { notification_type_enum } from "../../../../generated/prisma";
import {
	sendResultsAvailableEmail,
	sendSampleStatusUpdateEmail,
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

type SampleStatusForNotification =
	| "received"
	| "in_analysis"
	| "analysis_complete"
	| "return_requested"
	| "returned";

const statusMessages: Record<
	SampleStatusForNotification,
	{ title: string; message: (id: string) => string }
> = {
	received: {
		title: "Sample Received",
		message: (id) => `Your sample ${id} has been received at our laboratory.`,
	},
	in_analysis: {
		title: "Analysis Started",
		message: (id) => `Analysis has started on your sample ${id}.`,
	},
	analysis_complete: {
		title: "Analysis Complete",
		message: (id) =>
			`Analysis is complete for sample ${id}. Results will be available after payment verification.`,
	},
	return_requested: {
		title: "Return Requested",
		message: (id) =>
			`Your return request for sample ${id} has been noted. We will contact you for pickup.`,
	},
	returned: {
		title: "Sample Returned",
		message: (id) => `Your sample ${id} has been returned successfully.`,
	},
};

/**
 * Notify user of sample status change
 */
export async function notifySampleStatusChanged(params: {
	userId: string;
	sampleId: string;
	sampleIdentifier: string;
	serviceName: string;
	bookingReference: string;
	status: SampleStatusForNotification;
	notes?: string;
}) {
	const config = statusMessages[params.status];

	// Create in-app notification
	const notification = await enqueueInApp({
		userId: params.userId,
		type:
			params.status === "return_requested"
				? "sample_return_requested"
				: params.status === "returned"
					? "sample_returned"
					: "results_available", // Using results_available for analysis updates
		relatedEntityType: "sample",
		relatedEntityId: params.sampleId,
		title: config.title,
		message: config.message(params.sampleIdentifier),
	});

	// Send email notification
	const userDetails = await getUserEmailDetails(params.userId);
	if (userDetails) {
		const result = await sendSampleStatusUpdateEmail({
			to: userDetails.email,
			customerName: userDetails.name,
			sampleIdentifier: params.sampleIdentifier,
			serviceName: params.serviceName,
			status: params.status,
			bookingReference: params.bookingReference,
			notes: params.notes,
		});
		if (result.success) {
			await markEmailSent(notification.id);
		}
	}
}

/**
 * Notify user that results are available for download
 */
export async function notifyResultsAvailable(params: {
	userId: string;
	sampleId: string;
	sampleIdentifier: string;
	serviceName: string;
	bookingReference: string;
	bookingId: string;
}) {
	// Create in-app notification
	const notification = await enqueueInApp({
		userId: params.userId,
		type: "results_available",
		relatedEntityType: "sample",
		relatedEntityId: params.sampleId,
		title: "Results Available",
		message: `Results for sample ${params.sampleIdentifier} are now available for download.`,
	});

	// Send email notification
	const userDetails = await getUserEmailDetails(params.userId);
	if (userDetails) {
		const result = await sendResultsAvailableEmail({
			to: userDetails.email,
			customerName: userDetails.name,
			sampleIdentifier: params.sampleIdentifier,
			serviceName: params.serviceName,
			bookingReference: params.bookingReference,
			bookingId: params.bookingId,
		});
		if (result.success) {
			await markEmailSent(notification.id);
		}
	}
}
