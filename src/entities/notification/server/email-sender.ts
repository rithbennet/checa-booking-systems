/**
 * Email Sender Service
 * Handles sending emails via Resend with React Email templates
 *
 * Features:
 * - Centralized safeSendEmail wrapper with retry logic
 * - No-op when RESEND_API_KEY is missing (with clear logging)
 * - Email redirect for staging/testing environments
 * - Structured logging for observability
 * - Exponential backoff retry on failures
 */

import type React from "react";
import { env } from "@/env";
import {
	getEmailRedirectTo,
	getFromEmail,
	getReplyToEmail,
	isEmailEnabled,
	resend,
	shouldRedirectEmails,
} from "@/shared/server/email";
import {
	AccountRejectedEmail,
	AccountSuspendedEmail,
	AccountUpdatedEmail,
	AccountVerifiedEmail,
	AdminNewUserRegisteredEmail,
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
	WelcomeVerificationEmail,
} from "./email-templates";

// ============================================
// Types
// ============================================

export interface EmailResult {
	success: boolean;
	error?: string;
	messageId?: string;
}

export interface EmailLogContext {
	template: string;
	userId?: string;
	entityId?: string;
	entityType?: string;
	originalRecipient?: string;
}

// ============================================
// Configuration
// ============================================

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

/**
 * Get the base URL for dashboard links
 */
function getBaseUrl(): string {
	return env.BETTER_AUTH_URL || "http://localhost:3000";
}

// ============================================
// Core Email Functions
// ============================================

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Structured logger for email events
 */
function logEmailEvent(
	level: "info" | "warn" | "error",
	event: string,
	context: EmailLogContext & Record<string, unknown>,
): void {
	const timestamp = new Date().toISOString();
	const logData = {
		timestamp,
		event: `email-${event}`,
		...context,
	};

	switch (level) {
		case "info":
			console.log("[Email]", JSON.stringify(logData));
			break;
		case "warn":
			console.warn("[Email]", JSON.stringify(logData));
			break;
		case "error":
			console.error("[Email]", JSON.stringify(logData));
			break;
	}
}

/**
 * Safe email sender with retry logic and comprehensive error handling
 *
 * Features:
 * - No-ops gracefully when email is disabled
 * - Redirects emails in staging environments
 * - Retries with exponential backoff on transient failures
 * - Structured logging for all operations
 */
export async function safeSendEmail(params: {
	to: string | string[];
	subject: string;
	react: React.ReactElement;
	context: EmailLogContext;
}): Promise<EmailResult> {
	const { to, subject, react, context } = params;

	// Check if email is enabled
	if (!isEmailEnabled() || !resend) {
		logEmailEvent("info", "skipped", {
			...context,
			subject,
			reason: "email_disabled",
			originalRecipient: Array.isArray(to) ? to.join(", ") : to,
		});
		return { success: true }; // Silently succeed when not configured
	}

	// Determine final recipient (with redirect support for staging)
	let finalRecipient = to;
	const originalRecipient = Array.isArray(to) ? to.join(", ") : to;

	if (shouldRedirectEmails()) {
		const redirectTo = getEmailRedirectTo();
		if (redirectTo) {
			finalRecipient = redirectTo;
			logEmailEvent("info", "redirected", {
				...context,
				subject,
				originalRecipient,
				redirectedTo: redirectTo,
			});
		}
	}

	// Retry loop with exponential backoff
	let lastError: string | undefined;

	for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
		try {
			const { data, error } = await resend.emails.send({
				from: getFromEmail(),
				replyTo: getReplyToEmail(),
				to: finalRecipient,
				subject,
				react,
			});

			if (error) {
				lastError = error.message;
				logEmailEvent("warn", "api-error", {
					...context,
					subject,
					attempt,
					error: error.message,
					originalRecipient,
				});

				// If it's the last attempt, don't retry
				if (attempt === MAX_RETRIES) break;

				// Wait before retrying with exponential backoff
				const delay = INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1);
				await sleep(delay);
				continue;
			}

			// Success!
			logEmailEvent("info", "sent", {
				...context,
				subject,
				originalRecipient,
				messageId: data?.id,
				attempt,
			});

			return { success: true, messageId: data?.id };
		} catch (err) {
			lastError = err instanceof Error ? err.message : "Unknown error";
			logEmailEvent("error", "exception", {
				...context,
				subject,
				attempt,
				error: lastError,
				originalRecipient,
			});

			// If it's the last attempt, don't retry
			if (attempt === MAX_RETRIES) break;

			// Wait before retrying with exponential backoff
			const delay = INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1);
			await sleep(delay);
		}
	}

	// All retries exhausted
	logEmailEvent("error", "failed", {
		...context,
		subject,
		error: lastError,
		originalRecipient,
		maxRetriesExhausted: true,
	});

	return { success: false, error: lastError };
}

// ============================================
// Booking Email Functions
// ============================================

export async function sendBookingSubmittedEmail(params: {
	to: string;
	customerName: string;
	referenceNumber: string;
	status: "pending_approval" | "pending_user_verification";
	bookingId?: string;
	userId?: string;
}) {
	const dashboardUrl = `${getBaseUrl()}/bookings`;
	return safeSendEmail({
		to: params.to,
		subject: `Booking Submitted - ${params.referenceNumber}`,
		react: BookingSubmittedEmail({
			customerName: params.customerName,
			referenceNumber: params.referenceNumber,
			status: params.status,
			dashboardUrl,
		}),
		context: {
			template: "BookingSubmitted",
			entityType: "booking",
			entityId: params.bookingId,
			userId: params.userId,
		},
	});
}

export async function sendBookingApprovedEmail(params: {
	to: string;
	customerName: string;
	referenceNumber: string;
	bookingId: string;
	userId?: string;
}) {
	const dashboardUrl = `${getBaseUrl()}/bookings/${params.bookingId}`;
	return safeSendEmail({
		to: params.to,
		subject: `Booking Approved - ${params.referenceNumber}`,
		react: BookingApprovedEmail({
			customerName: params.customerName,
			referenceNumber: params.referenceNumber,
			dashboardUrl,
		}),
		context: {
			template: "BookingApproved",
			entityType: "booking",
			entityId: params.bookingId,
			userId: params.userId,
		},
	});
}

export async function sendBookingRejectedEmail(params: {
	to: string;
	customerName: string;
	referenceNumber: string;
	reason: string;
	bookingId: string;
	userId?: string;
}) {
	const dashboardUrl = `${getBaseUrl()}/bookings/${params.bookingId}`;
	return safeSendEmail({
		to: params.to,
		subject: `Booking Rejected - ${params.referenceNumber}`,
		react: BookingRejectedEmail({
			customerName: params.customerName,
			referenceNumber: params.referenceNumber,
			reason: params.reason,
			dashboardUrl,
		}),
		context: {
			template: "BookingRejected",
			entityType: "booking",
			entityId: params.bookingId,
			userId: params.userId,
		},
	});
}

export async function sendBookingRevisionRequestedEmail(params: {
	to: string;
	customerName: string;
	referenceNumber: string;
	adminNotes: string;
	bookingId: string;
	userId?: string;
}) {
	const editUrl = `${getBaseUrl()}/bookings/${params.bookingId}/edit`;
	return safeSendEmail({
		to: params.to,
		subject: `Action Required: Booking ${params.referenceNumber} Needs Revision`,
		react: BookingRevisionRequestedEmail({
			customerName: params.customerName,
			referenceNumber: params.referenceNumber,
			adminNotes: params.adminNotes,
			editUrl,
		}),
		context: {
			template: "BookingRevisionRequested",
			entityType: "booking",
			entityId: params.bookingId,
			userId: params.userId,
		},
	});
}

// ============================================
// Account Email Functions
// ============================================

export async function sendAccountVerifiedEmail(params: {
	to: string;
	customerName: string;
	userId?: string;
}) {
	const dashboardUrl = `${getBaseUrl()}/dashboard`;
	return safeSendEmail({
		to: params.to,
		subject: "Your ChECA Lab Account Has Been Verified",
		react: AccountVerifiedEmail({
			customerName: params.customerName,
			dashboardUrl,
		}),
		context: {
			template: "AccountVerified",
			entityType: "user",
			userId: params.userId,
		},
	});
}

export async function sendAccountUpdatedEmail(params: {
	to: string;
	customerName: string;
	changedFields: string[];
	userId?: string;
}) {
	const dashboardUrl = `${getBaseUrl()}/profile`;
	return safeSendEmail({
		to: params.to,
		subject: "Your ChECA Lab Account Has Been Updated",
		react: AccountUpdatedEmail({
			customerName: params.customerName,
			dashboardUrl,
			changedFields: params.changedFields,
		}),
		context: {
			template: "AccountUpdated",
			entityType: "user",
			userId: params.userId,
		},
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
	sampleId?: string;
	userId?: string;
}) {
	const dashboardUrl = `${getBaseUrl()}/samples`;
	return safeSendEmail({
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
		context: {
			template: "SampleStatusUpdate",
			entityType: "sample",
			entityId: params.sampleId,
			userId: params.userId,
		},
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
	invoiceId?: string;
	userId?: string;
}) {
	const dashboardUrl = `${getBaseUrl()}/bookings/${params.bookingId}`;
	return safeSendEmail({
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
		context: {
			template: "InvoiceUploaded",
			entityType: "invoice",
			entityId: params.invoiceId ?? params.bookingId,
			userId: params.userId,
		},
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
	paymentId?: string;
	userId?: string;
}) {
	const dashboardUrl = `${getBaseUrl()}/bookings/${params.bookingId}`;
	return safeSendEmail({
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
		context: {
			template: "PaymentVerified",
			entityType: "payment",
			entityId: params.paymentId ?? params.bookingId,
			userId: params.userId,
		},
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
	formId?: string;
	userId?: string;
}) {
	const dashboardUrl = `${getBaseUrl()}/bookings/${params.bookingId}`;
	return safeSendEmail({
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
		context: {
			template: "ServiceFormReady",
			entityType: "serviceForm",
			entityId: params.formId ?? params.bookingId,
			userId: params.userId,
		},
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
	sampleId?: string;
	userId?: string;
}) {
	const dashboardUrl = `${getBaseUrl()}/bookings/${params.bookingId}`;
	return safeSendEmail({
		to: params.to,
		subject: `Results Available - ${params.sampleIdentifier}`,
		react: ResultsAvailableEmail({
			customerName: params.customerName,
			sampleIdentifier: params.sampleIdentifier,
			serviceName: params.serviceName,
			bookingReference: params.bookingReference,
			dashboardUrl,
		}),
		context: {
			template: "ResultsAvailable",
			entityType: "sample",
			entityId: params.sampleId ?? params.bookingId,
			userId: params.userId,
		},
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
	bookingId?: string;
}) {
	const adminDashboardUrl = `${getBaseUrl()}/admin/bookings`;
	return safeSendEmail({
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
		context: {
			template: "AdminNewBooking",
			entityType: "booking",
			entityId: params.bookingId,
		},
	});
}

export async function sendAdminNewUserPendingEmail(params: {
	to: string | string[];
	adminName: string;
	customerName: string;
	customerEmail: string;
	userId?: string;
}) {
	const adminDashboardUrl = `${getBaseUrl()}/admin/users`;
	return safeSendEmail({
		to: params.to,
		subject: `New User Pending Verification: ${params.customerName}`,
		react: AdminNotificationEmail({
			adminName: params.adminName,
			notificationType: "new_user_pending",
			customerName: params.customerName,
			customerEmail: params.customerEmail,
			adminDashboardUrl,
		}),
		context: {
			template: "AdminNewUserPending",
			entityType: "user",
			entityId: params.userId,
		},
	});
}

export async function sendAdminPaymentPendingEmail(params: {
	to: string | string[];
	adminName: string;
	referenceNumber: string;
	customerName: string;
	paymentId?: string;
}) {
	const adminDashboardUrl = `${getBaseUrl()}/admin/finance`;
	return safeSendEmail({
		to: params.to,
		subject: `Payment Proof Uploaded: ${params.referenceNumber}`,
		react: AdminNotificationEmail({
			adminName: params.adminName,
			notificationType: "payment_pending",
			referenceNumber: params.referenceNumber,
			customerName: params.customerName,
			adminDashboardUrl,
		}),
		context: {
			template: "AdminPaymentPending",
			entityType: "payment",
			entityId: params.paymentId,
		},
	});
}

export async function sendAdminUserVerifiedEmail(params: {
	to: string | string[];
	adminName: string;
	customerEmail: string;
	bookingCount: number;
	userId?: string;
}) {
	const adminDashboardUrl = `${getBaseUrl()}/admin/bookings`;
	return safeSendEmail({
		to: params.to,
		subject: `User Verified: ${params.customerEmail}`,
		react: AdminNotificationEmail({
			adminName: params.adminName,
			notificationType: "user_verified",
			customerEmail: params.customerEmail,
			bookingCount: params.bookingCount,
			adminDashboardUrl,
		}),
		context: {
			template: "AdminUserVerified",
			entityType: "user",
			entityId: params.userId,
		},
	});
}

export async function sendAdminSignedFormsUploadedEmail(params: {
	to: string | string[];
	adminName: string;
	referenceNumber: string;
	customerName: string;
	bookingId?: string;
}) {
	const adminDashboardUrl = `${getBaseUrl()}/admin/bookings`;
	return safeSendEmail({
		to: params.to,
		subject: `Signed Forms Uploaded: ${params.referenceNumber}`,
		react: AdminNotificationEmail({
			adminName: params.adminName,
			notificationType: "signed_forms_uploaded",
			referenceNumber: params.referenceNumber,
			customerName: params.customerName,
			adminDashboardUrl,
		}),
		context: {
			template: "AdminSignedFormsUploaded",
			entityType: "booking",
			entityId: params.bookingId,
		},
	});
}

// ============================================
// User Registration Email Functions
// ============================================

export async function sendWelcomeVerificationEmail(params: {
	to: string;
	customerName: string;
	verificationUrl: string;
	userId?: string;
}) {
	return safeSendEmail({
		to: params.to,
		subject: "Welcome to ChECA Lab - Please Verify Your Email",
		react: WelcomeVerificationEmail({
			customerName: params.customerName,
			verificationUrl: params.verificationUrl,
		}),
		context: {
			template: "WelcomeVerification",
			entityType: "user",
			userId: params.userId,
		},
	});
}

export async function sendAdminNewUserRegisteredEmail(params: {
	to: string | string[];
	adminName: string;
	customerName: string;
	customerEmail: string;
	userType: string;
	userId?: string;
}) {
	const adminDashboardUrl = `${getBaseUrl()}/admin/users`;
	return safeSendEmail({
		to: params.to,
		subject: `New User Registered: ${params.customerName}`,
		react: AdminNewUserRegisteredEmail({
			adminName: params.adminName,
			customerName: params.customerName,
			customerEmail: params.customerEmail,
			userType: params.userType,
			adminDashboardUrl,
		}),
		context: {
			template: "AdminNewUserRegistered",
			entityType: "user",
			entityId: params.userId,
		},
	});
}

export async function sendAccountRejectedEmail(params: {
	to: string;
	customerName: string;
	reason?: string;
	userId?: string;
}) {
	const contactEmail =
		env.EMAIL_REPLY_TO || env.EMAIL_FROM || "support@checa.lab";
	return safeSendEmail({
		to: params.to,
		subject: "ChECA Lab Account Registration Not Approved",
		react: AccountRejectedEmail({
			customerName: params.customerName,
			reason: params.reason,
			contactEmail,
		}),
		context: {
			template: "AccountRejected",
			entityType: "user",
			userId: params.userId,
		},
	});
}

export async function sendAccountSuspendedEmail(params: {
	to: string;
	customerName: string;
	status: "suspended" | "inactive";
	reason?: string;
	userId?: string;
}) {
	const contactEmail =
		env.EMAIL_REPLY_TO || env.EMAIL_FROM || "support@checa.lab";
	const statusLabel =
		params.status === "suspended" ? "Suspended" : "Deactivated";
	return safeSendEmail({
		to: params.to,
		subject: `ChECA Lab Account ${statusLabel}`,
		react: AccountSuspendedEmail({
			customerName: params.customerName,
			status: params.status,
			reason: params.reason,
			contactEmail,
		}),
		context: {
			template: "AccountSuspended",
			entityType: "user",
			userId: params.userId,
		},
	});
}
