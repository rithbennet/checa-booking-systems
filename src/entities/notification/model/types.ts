/**
 * Notification Entity Types
 */

export type NotificationType =
	| "booking_submitted"
	| "booking_pending_verification"
	| "booking_approved"
	| "booking_rejected"
	| "service_modification_requested"
	| "service_form_ready"
	| "forms_signed_uploaded"
	| "invoice_uploaded"
	| "payment_reminder"
	| "payment_verified"
	| "results_available"
	| "sample_return_requested"
	| "sample_returned"
	| "process_complete"
	| "account_updated";

export interface NotificationVM {
	id: string;
	type: NotificationType;
	title: string;
	message: string;
	relatedEntityType: string | null;
	relatedEntityId: string | null;
	isRead: boolean;
	createdAt: string;
}

export interface NotificationsResponse {
	items: NotificationVM[];
	unreadCount: number;
}

// ============================================
// Notification Payload Contracts
// ============================================

/**
 * Payload for notifying admins about new user registration
 * @trigger After user completes email verification
 */
export interface NewUserRegisteredPayload {
	adminIds: string[];
	userId: string;
	userName: string;
	userEmail: string;
	userType: "utm_member" | "external_member" | "lab_administrator";
}

/**
 * Payload for notifying user that account is approved
 * @trigger After admin approves user in /api/admin/users/[userId]/approve
 */
export interface UserApprovedPayload {
	userId: string;
}

/**
 * Payload for notifying user that account is rejected
 * @trigger After admin rejects user in /api/admin/users/[userId]/reject
 */
export interface UserRejectedPayload {
	userId: string;
	reason?: string;
}

/**
 * Payload for notifying user of account status change
 * @trigger After admin changes status in /api/admin/users/[userId]/status
 */
export interface UserStatusChangedPayload {
	userId: string;
	status: "suspended" | "inactive";
	reason?: string;
}

/**
 * Sample status types that trigger notifications
 */
export type NotifiableSampleStatus =
	| "received"
	| "in_analysis"
	| "analysis_complete"
	| "return_requested"
	| "returned";

/**
 * Payload for notifying user of sample status change
 * @trigger After admin updates sample status in /api/admin/samples/[id]/status
 */
export interface SampleStatusChangedPayload {
	userId: string;
	sampleId: string;
	sampleIdentifier: string;
	serviceName: string;
	bookingReference: string;
	status: NotifiableSampleStatus;
	notes?: string;
}

/**
 * Payload for notifying user that results are available
 * @trigger After payment is verified and results are accessible
 */
export interface ResultsAvailablePayload {
	userId: string;
	sampleId: string;
	sampleIdentifier: string;
	serviceName: string;
	bookingReference: string;
	bookingId: string;
}

/**
 * Payload for notifying user that invoice is uploaded
 * @trigger After admin uploads/creates invoice for a service form
 */
export interface InvoiceUploadedPayload {
	userId: string;
	invoiceId: string;
	invoiceNumber: string;
	amount: string;
	dueDate: string;
	bookingReference: string;
	bookingId: string;
}

/**
 * Payload for notifying user that payment is verified
 * @trigger After admin verifies payment
 */
export interface PaymentVerifiedPayload {
	userId: string;
	paymentId: string;
	invoiceNumber: string;
	amount: string;
	paymentDate: string;
	bookingReference: string;
	bookingId: string;
}

/**
 * Payload for notifying user that service form is ready
 * @trigger After service form generation is complete
 */
export interface ServiceFormReadyPayload {
	userId: string;
	formId: string;
	formNumber: string;
	bookingReference: string;
	bookingId: string;
	validUntil: string;
	requiresWorkingAreaAgreement: boolean;
}

/**
 * Payload for notifying admins about payment upload
 * @trigger After user uploads payment proof
 */
export interface AdminPaymentUploadedPayload {
	adminIds: string[];
	paymentId: string;
	bookingReference: string;
	customerName: string;
	amount: string;
}

/**
 * Payload for notifying admins about signed forms upload
 * @trigger After user uploads signed forms
 */
export interface AdminSignedFormsPayload {
	adminIds: string[];
	formId: string;
	formNumber: string;
	bookingReference: string;
	customerName: string;
}

/**
 * Result from notification operations
 */
export interface NotificationResult {
	success: boolean;
	notificationId?: string;
	emailSent?: boolean;
	error?: string;
}
