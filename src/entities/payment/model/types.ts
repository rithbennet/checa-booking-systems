/**
 * Payment entity types
 * Core payment types for financial management
 */

import type {
	payment_method_enum,
	payment_status_enum,
} from "generated/prisma";

// ==============================================================
// View Models
// ==============================================================

/**
 * Base payment view model with service form and booking context
 */
export interface PaymentVM {
	id: string;
	serviceFormId: string;
	formNumber: string;
	bookingRef: string;
	bookingId: string;
	amount: string;
	paymentMethod: payment_method_enum;
	paymentDate: string;
	referenceNumber: string | null;
	receiptFilePath: string;
	status: payment_status_enum;
	uploadedBy: {
		id: string;
		name: string;
	};
	uploadedAt: string;
	verifiedAt: string | null;
	verifiedBy: {
		id: string;
		name: string;
	} | null;
	verificationNotes: string | null;
	// Additional context
	client: {
		id: string;
		name: string;
		email: string;
		userType: string;
	};
	organization: string | null;
	// ServiceForm context for verification
	formAmount: string;
	formValidUntil: string;
	formStatus: string;
	totalVerifiedForForm: string;
	formBalance: string;
}

/**
 * Pending payment view model for verification queue
 */
export interface PendingPaymentVM extends PaymentVM {
	age: number; // days since upload
}

/**
 * Payment history view model
 */
export interface PaymentHistoryVM extends PaymentVM {
	processedAt: string; // verifiedAt for history
}

// ==============================================================
// Request/Response Types
// ==============================================================

export interface PaymentListFilters {
	status?: payment_status_enum | payment_status_enum[];
	serviceFormId?: string;
	bookingId?: string;
	method?: payment_method_enum;
	verifierId?: string;
	dateFrom?: string;
	dateTo?: string;
	q?: string;
	page: number;
	pageSize: number;
}

export interface PaymentListResponse {
	items: PaymentVM[];
	total: number;
}

export interface PendingPaymentsResponse {
	items: PendingPaymentVM[];
	total: number;
}

export interface PaymentHistoryResponse {
	items: PaymentHistoryVM[];
	total: number;
}

export interface VerifyPaymentRequest {
	paymentId: string;
	notes?: string;
}

export interface RejectPaymentRequest {
	paymentId: string;
	notes: string;
}

export interface CreateManualPaymentRequest {
	serviceFormId: string;
	bookingId: string;
	amount: string;
	paymentMethod: payment_method_enum;
	paymentDate: string;
	referenceNumber?: string;
	receiptFilePath: string;
	notes?: string;
}

// ==============================================================
// Helper Types
// ==============================================================

export type PaymentMethodLabel = {
	[K in payment_method_enum]: string;
};

export const PAYMENT_METHOD_LABELS: PaymentMethodLabel = {
	eft: "EFT / Bank Transfer",
	vote_transfer: "Vote Transfer",
	local_order: "Local Order",
};

export type PaymentStatusLabel = {
	[K in payment_status_enum]: string;
};

export const PAYMENT_STATUS_LABELS: PaymentStatusLabel = {
	pending_verification: "Pending Verification",
	verified: "Verified",
	rejected: "Rejected",
};
