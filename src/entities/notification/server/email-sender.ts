/**
 * Email Sender Service
 * Handles sending emails via Resend with React Email templates
 */

import { env } from "@/env";
import {
	getFromEmail,
	getReplyToEmail,
	isEmailEnabled,
	resend,
} from "@/shared/server/email";
import {
	AccountVerifiedEmail,
	AdminNotificationEmail,
	BookingApprovedEmail,
	BookingRejectedEmail,
	BookingRevisionRequestedEmail,
	BookingSubmittedEmail,
	InvoiceUploadedEmail,
	PaymentVerifiedEmail,
	ResultsAvailableEmail,
	SampleStatusUpdateEmail,
	ServiceFormReadyEmail,
} from "./email-templates";

/**
 * Get the base URL for dashboard links
 */
function getBaseUrl(): string {
	return env.BETTER_AUTH_URL || "http://localhost:3000";
}

/**
 * Send email with error handling
 */
async function sendEmail(params: {
	to: string | string[];
	subject: string;
	react: React.ReactElement;
}): Promise<{ success: boolean; error?: string }> {
	if (!isEmailEnabled() || !resend) {
		console.log(
			"[Email] Resend not configured, skipping email:",
			params.subject,
		);
		return { success: true }; // Silently succeed when not configured
	}

	try {
		const { error } = await resend.emails.send({
			from: getFromEmail(),
			replyTo: getReplyToEmail(),
			to: params.to,
			subject: params.subject,
			react: params.react,
		});

		if (error) {
			console.error("[Email] Failed to send:", error);
			return { success: false, error: error.message };
		}

		console.log("[Email] Sent successfully:", params.subject);
		return { success: true };
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : "Unknown error";
		console.error("[Email] Error sending email:", errorMessage);
		return { success: false, error: errorMessage };
	}
}

// ============================================
// Booking Email Functions
// ============================================

export async function sendBookingSubmittedEmail(params: {
	to: string;
	customerName: string;
	referenceNumber: string;
	status: "pending_approval" | "pending_user_verification";
}) {
	const dashboardUrl = `${getBaseUrl()}/bookings`;
	return sendEmail({
		to: params.to,
		subject: `Booking Submitted - ${params.referenceNumber}`,
		react: BookingSubmittedEmail({
			customerName: params.customerName,
			referenceNumber: params.referenceNumber,
			status: params.status,
			dashboardUrl,
		}),
	});
}

export async function sendBookingApprovedEmail(params: {
	to: string;
	customerName: string;
	referenceNumber: string;
	bookingId: string;
}) {
	const dashboardUrl = `${getBaseUrl()}/bookings/${params.bookingId}`;
	return sendEmail({
		to: params.to,
		subject: `Booking Approved - ${params.referenceNumber}`,
		react: BookingApprovedEmail({
			customerName: params.customerName,
			referenceNumber: params.referenceNumber,
			dashboardUrl,
		}),
	});
}

export async function sendBookingRejectedEmail(params: {
	to: string;
	customerName: string;
	referenceNumber: string;
	reason: string;
	bookingId: string;
}) {
	const dashboardUrl = `${getBaseUrl()}/bookings/${params.bookingId}`;
	return sendEmail({
		to: params.to,
		subject: `Booking Rejected - ${params.referenceNumber}`,
		react: BookingRejectedEmail({
			customerName: params.customerName,
			referenceNumber: params.referenceNumber,
			reason: params.reason,
			dashboardUrl,
		}),
	});
}

export async function sendBookingRevisionRequestedEmail(params: {
	to: string;
	customerName: string;
	referenceNumber: string;
	adminNotes: string;
	bookingId: string;
}) {
	const editUrl = `${getBaseUrl()}/bookings/${params.bookingId}/edit`;
	return sendEmail({
		to: params.to,
		subject: `Action Required: Booking ${params.referenceNumber} Needs Revision`,
		react: BookingRevisionRequestedEmail({
			customerName: params.customerName,
			referenceNumber: params.referenceNumber,
			adminNotes: params.adminNotes,
			editUrl,
		}),
	});
}

// ============================================
// Account Email Functions
// ============================================

export async function sendAccountVerifiedEmail(params: {
	to: string;
	customerName: string;
}) {
	const dashboardUrl = `${getBaseUrl()}/dashboard`;
	return sendEmail({
		to: params.to,
		subject: "Your ChECA Lab Account Has Been Verified",
		react: AccountVerifiedEmail({
			customerName: params.customerName,
			dashboardUrl,
		}),
	});
}

// ============================================
// Sample Tracking Email Functions
// ============================================

export async function sendSampleStatusUpdateEmail(params: {
	to: string;
	customerName: string;
	sampleIdentifier: string;
	serviceName: string;
	status:
		| "received"
		| "in_analysis"
		| "analysis_complete"
		| "return_requested"
		| "returned";
	bookingReference: string;
	notes?: string;
}) {
	const dashboardUrl = `${getBaseUrl()}/samples`;
	return sendEmail({
		to: params.to,
		subject: `Sample Update: ${params.sampleIdentifier} - ${params.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
		react: SampleStatusUpdateEmail({
			customerName: params.customerName,
			sampleIdentifier: params.sampleIdentifier,
			serviceName: params.serviceName,
			status: params.status,
			bookingReference: params.bookingReference,
			notes: params.notes,
			dashboardUrl,
		}),
	});
}

// ============================================
// Finance Email Functions
// ============================================

export async function sendInvoiceUploadedEmail(params: {
	to: string;
	customerName: string;
	invoiceNumber: string;
	amount: string;
	dueDate: string;
	bookingReference: string;
	bookingId: string;
}) {
	const dashboardUrl = `${getBaseUrl()}/bookings/${params.bookingId}`;
	return sendEmail({
		to: params.to,
		subject: `Invoice Ready - ${params.invoiceNumber}`,
		react: InvoiceUploadedEmail({
			customerName: params.customerName,
			invoiceNumber: params.invoiceNumber,
			amount: params.amount,
			dueDate: params.dueDate,
			bookingReference: params.bookingReference,
			dashboardUrl,
		}),
	});
}

export async function sendPaymentVerifiedEmail(params: {
	to: string;
	customerName: string;
	invoiceNumber: string;
	amount: string;
	paymentDate: string;
	bookingReference: string;
	bookingId: string;
}) {
	const dashboardUrl = `${getBaseUrl()}/bookings/${params.bookingId}`;
	return sendEmail({
		to: params.to,
		subject: `Payment Verified - ${params.invoiceNumber}`,
		react: PaymentVerifiedEmail({
			customerName: params.customerName,
			invoiceNumber: params.invoiceNumber,
			amount: params.amount,
			paymentDate: params.paymentDate,
			bookingReference: params.bookingReference,
			dashboardUrl,
		}),
	});
}

// ============================================
// Service Form Email Functions
// ============================================

export async function sendServiceFormReadyEmail(params: {
	to: string;
	customerName: string;
	formNumber: string;
	bookingReference: string;
	validUntil: string;
	requiresWorkingAreaAgreement: boolean;
	bookingId: string;
}) {
	const dashboardUrl = `${getBaseUrl()}/bookings/${params.bookingId}`;
	return sendEmail({
		to: params.to,
		subject: `Service Form Ready - ${params.formNumber}`,
		react: ServiceFormReadyEmail({
			customerName: params.customerName,
			formNumber: params.formNumber,
			bookingReference: params.bookingReference,
			validUntil: params.validUntil,
			requiresWorkingAreaAgreement: params.requiresWorkingAreaAgreement,
			dashboardUrl,
		}),
	});
}

// ============================================
// Results Email Functions
// ============================================

export async function sendResultsAvailableEmail(params: {
	to: string;
	customerName: string;
	sampleIdentifier: string;
	serviceName: string;
	bookingReference: string;
	bookingId: string;
}) {
	const dashboardUrl = `${getBaseUrl()}/bookings/${params.bookingId}`;
	return sendEmail({
		to: params.to,
		subject: `Results Available - ${params.sampleIdentifier}`,
		react: ResultsAvailableEmail({
			customerName: params.customerName,
			sampleIdentifier: params.sampleIdentifier,
			serviceName: params.serviceName,
			bookingReference: params.bookingReference,
			dashboardUrl,
		}),
	});
}

// ============================================
// Admin Notification Email Functions
// ============================================

export async function sendAdminNewBookingEmail(params: {
	to: string | string[];
	adminName: string;
	referenceNumber: string;
	customerName: string;
	customerEmail: string;
}) {
	const adminDashboardUrl = `${getBaseUrl()}/admin/bookings`;
	return sendEmail({
		to: params.to,
		subject: `New Booking: ${params.referenceNumber}`,
		react: AdminNotificationEmail({
			adminName: params.adminName,
			notificationType: "new_booking",
			referenceNumber: params.referenceNumber,
			customerName: params.customerName,
			customerEmail: params.customerEmail,
			adminDashboardUrl,
		}),
	});
}

export async function sendAdminNewUserPendingEmail(params: {
	to: string | string[];
	adminName: string;
	customerName: string;
	customerEmail: string;
}) {
	const adminDashboardUrl = `${getBaseUrl()}/admin/users`;
	return sendEmail({
		to: params.to,
		subject: `New User Pending Verification: ${params.customerName}`,
		react: AdminNotificationEmail({
			adminName: params.adminName,
			notificationType: "new_user_pending",
			customerName: params.customerName,
			customerEmail: params.customerEmail,
			adminDashboardUrl,
		}),
	});
}

export async function sendAdminPaymentPendingEmail(params: {
	to: string | string[];
	adminName: string;
	referenceNumber: string;
	customerName: string;
}) {
	const adminDashboardUrl = `${getBaseUrl()}/admin/finance`;
	return sendEmail({
		to: params.to,
		subject: `Payment Proof Uploaded: ${params.referenceNumber}`,
		react: AdminNotificationEmail({
			adminName: params.adminName,
			notificationType: "payment_pending",
			referenceNumber: params.referenceNumber,
			customerName: params.customerName,
			adminDashboardUrl,
		}),
	});
}

export async function sendAdminUserVerifiedEmail(params: {
	to: string | string[];
	adminName: string;
	customerEmail: string;
	bookingCount: number;
}) {
	const adminDashboardUrl = `${getBaseUrl()}/admin/bookings`;
	return sendEmail({
		to: params.to,
		subject: `User Verified: ${params.customerEmail}`,
		react: AdminNotificationEmail({
			adminName: params.adminName,
			notificationType: "user_verified",
			customerEmail: params.customerEmail,
			bookingCount: params.bookingCount,
			adminDashboardUrl,
		}),
	});
}

export async function sendAdminSignedFormsUploadedEmail(params: {
	to: string | string[];
	adminName: string;
	referenceNumber: string;
	customerName: string;
}) {
	const adminDashboardUrl = `${getBaseUrl()}/admin/bookings`;
	return sendEmail({
		to: params.to,
		subject: `Signed Forms Uploaded: ${params.referenceNumber}`,
		react: AdminNotificationEmail({
			adminName: params.adminName,
			notificationType: "signed_forms_uploaded",
			referenceNumber: params.referenceNumber,
			customerName: params.customerName,
			adminDashboardUrl,
		}),
	});
}
