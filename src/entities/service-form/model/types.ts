/**
 * ServiceForm entity types
 */

import type { form_status_enum } from "generated/prisma";

export type ServiceFormStatus = form_status_enum | "verified";

export interface ServiceFormListVM {
	id: string;
	formNumber: string;
	facilityLab: string;
	subtotal: string;
	totalAmount: string;
	validUntil: string;
	status: ServiceFormStatus;
	// Document status
	hasUnsignedForm: boolean;
	hasSignedForm: boolean;
	requiresWorkingAreaAgreement: boolean;
	hasUnsignedWorkspaceForm: boolean;
	hasSignedWorkspaceForm: boolean;
	// File paths
	serviceFormUnsignedPdfPath: string;
	serviceFormSignedPdfPath: string | null;
	workingAreaAgreementUnsignedPdfPath: string | null;
	workingAreaAgreementSignedPdfPath: string | null;
	// Booking info
	bookingId: string;
	bookingRef: string;
	// Client info
	client: {
		id: string;
		name: string;
		email: string;
		userType: string;
	};
	organization: string | null;
	// Timestamps
	generatedAt: string;
	downloadedAt: string | null;
	signedFormsUploadedAt: string | null;
	isExpired: boolean;
}

export interface ServiceFormListFilters {
	status?: form_status_enum[];
	bookingId?: string;
	q?: string;
	page: number;
	pageSize: number;
}
