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
	| "process_complete";

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
