/**
 * Notification Health Check API
 * Performs dry-run render of all email templates with mock data
 *
 * GET /api/admin/notifications/health
 */

import type React from "react";
import {
	AccountRejectedEmail,
	AccountSuspendedEmail,
	AccountVerifiedEmail,
	AdminNewUserRegisteredEmail,
	AdminNotificationEmail,
	BookingApprovedEmail,
	BookingRejectedEmail,
	BookingRevisionRequestedEmail,
	BookingSubmittedEmail,
	PaymentVerifiedEmail,
	ResultsAvailableEmail,
	SampleStatusUpdateEmail,
	ServiceFormReadyEmail,
	WelcomeVerificationEmail,
} from "@/entities/notification/server/email-templates";
import { createProtectedHandler, forbidden } from "@/shared/lib/api-factory";
import { isEmailEnabled } from "@/shared/server/email";

interface TemplateRenderResult {
	name: string;
	success: boolean;
	error?: string;
}

/**
 * Try to instantiate a template and check if it throws
 */
function tryRenderTemplate(
	name: string,
	templateFn: () => React.ReactElement,
): TemplateRenderResult {
	try {
		// Just call the template function to verify it doesn't throw
		templateFn();
		return {
			name,
			success: true,
		};
	} catch (error) {
		return {
			name,
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export const GET = createProtectedHandler(async (_request: Request, user) => {
	// Only admins can access health check
	if (user.role !== "lab_administrator") return forbidden();

	const mockData = {
		customerName: "Test User",
		dashboardUrl: "https://example.com/dashboard",
		editUrl: "https://example.com/bookings/123/edit",
		referenceNumber: "BK-TEST-001",
		verificationUrl: "https://example.com/verify/token",
		adminDashboardUrl: "https://example.com/admin/dashboard",
		contactEmail: "support@checa.lab",
		adminName: "Admin",
	};

	const results: TemplateRenderResult[] = [];

	// Test all templates using factory functions
	const templates: Array<{ name: string; render: () => React.ReactElement }> = [
		{
			name: "AccountVerifiedEmail",
			render: () =>
				AccountVerifiedEmail({
					customerName: mockData.customerName,
					dashboardUrl: mockData.dashboardUrl,
				}),
		},
		{
			name: "AccountRejectedEmail",
			render: () =>
				AccountRejectedEmail({
					customerName: mockData.customerName,
					reason: "Test rejection reason",
					contactEmail: mockData.contactEmail,
				}),
		},
		{
			name: "AccountSuspendedEmail",
			render: () =>
				AccountSuspendedEmail({
					customerName: mockData.customerName,
					status: "suspended",
					reason: "Test suspension reason",
					contactEmail: mockData.contactEmail,
				}),
		},
		{
			name: "BookingSubmittedEmail",
			render: () =>
				BookingSubmittedEmail({
					customerName: mockData.customerName,
					referenceNumber: mockData.referenceNumber,
					status: "pending_approval",
					dashboardUrl: mockData.dashboardUrl,
				}),
		},
		{
			name: "BookingApprovedEmail",
			render: () =>
				BookingApprovedEmail({
					customerName: mockData.customerName,
					referenceNumber: mockData.referenceNumber,
					dashboardUrl: mockData.dashboardUrl,
				}),
		},
		{
			name: "BookingRejectedEmail",
			render: () =>
				BookingRejectedEmail({
					customerName: mockData.customerName,
					referenceNumber: mockData.referenceNumber,
					reason: "Test rejection reason",
					dashboardUrl: mockData.dashboardUrl,
				}),
		},
		{
			name: "BookingRevisionRequestedEmail",
			render: () =>
				BookingRevisionRequestedEmail({
					customerName: mockData.customerName,
					referenceNumber: mockData.referenceNumber,
					adminNotes: "Please update the sample quantity",
					editUrl: mockData.editUrl,
				}),
		},
		{
			name: "PaymentVerifiedEmail",
			render: () =>
				PaymentVerifiedEmail({
					customerName: mockData.customerName,
					formNumber: "SF-TEST-001",
					amount: "RM 500.00",
					paymentDate: "2025-01-01",
					bookingReference: mockData.referenceNumber,
					dashboardUrl: mockData.dashboardUrl,
				}),
		},
		{
			name: "SampleStatusUpdateEmail",
			render: () =>
				SampleStatusUpdateEmail({
					customerName: mockData.customerName,
					sampleIdentifier: "SAMPLE-001",
					serviceName: "XRD Analysis",
					status: "received",
					bookingReference: mockData.referenceNumber,
					notes: "Sample received in good condition",
					dashboardUrl: mockData.dashboardUrl,
				}),
		},
		{
			name: "ServiceFormReadyEmail",
			render: () =>
				ServiceFormReadyEmail({
					customerName: mockData.customerName,
					formNumber: "SF-TEST-001",
					bookingReference: mockData.referenceNumber,
					validUntil: "2025-02-01",
					requiresWorkingAreaAgreement: true,
					dashboardUrl: mockData.dashboardUrl,
				}),
		},
		{
			name: "ResultsAvailableEmail",
			render: () =>
				ResultsAvailableEmail({
					customerName: mockData.customerName,
					sampleIdentifier: "SAMPLE-001",
					serviceName: "XRD Analysis",
					bookingReference: mockData.referenceNumber,
					dashboardUrl: mockData.dashboardUrl,
				}),
		},
		{
			name: "WelcomeVerificationEmail",
			render: () =>
				WelcomeVerificationEmail({
					customerName: mockData.customerName,
					verificationUrl: mockData.verificationUrl,
				}),
		},
		{
			name: "AdminNewUserRegisteredEmail",
			render: () =>
				AdminNewUserRegisteredEmail({
					adminName: mockData.adminName,
					customerName: mockData.customerName,
					customerEmail: "user@example.com",
					userType: "UTM Member",
					adminDashboardUrl: mockData.adminDashboardUrl,
				}),
		},
		{
			name: "AdminNotificationEmail_NewBooking",
			render: () =>
				AdminNotificationEmail({
					adminName: mockData.adminName,
					notificationType: "new_booking",
					referenceNumber: mockData.referenceNumber,
					customerName: mockData.customerName,
					customerEmail: "user@example.com",
					adminDashboardUrl: mockData.adminDashboardUrl,
				}),
		},
		{
			name: "AdminNotificationEmail_PaymentPending",
			render: () =>
				AdminNotificationEmail({
					adminName: mockData.adminName,
					notificationType: "payment_pending",
					referenceNumber: mockData.referenceNumber,
					customerName: mockData.customerName,
					adminDashboardUrl: mockData.adminDashboardUrl,
				}),
		},
		{
			name: "AdminNotificationEmail_SignedFormsUploaded",
			render: () =>
				AdminNotificationEmail({
					adminName: mockData.adminName,
					notificationType: "signed_forms_uploaded",
					referenceNumber: mockData.referenceNumber,
					customerName: mockData.customerName,
					adminDashboardUrl: mockData.adminDashboardUrl,
				}),
		},
	];

	// Render all templates
	for (const template of templates) {
		const result = tryRenderTemplate(template.name, template.render);
		results.push(result);
	}

	const allSuccess = results.every((r) => r.success);
	const failedCount = results.filter((r) => !r.success).length;

	return Response.json({
		status: allSuccess ? "healthy" : "degraded",
		emailEnabled: isEmailEnabled(),
		timestamp: new Date().toISOString(),
		summary: {
			total: results.length,
			passed: results.length - failedCount,
			failed: failedCount,
		},
		templates: results,
	});
});
