/**
 * Booking Document Types
 *
 * Types for the booking document upload feature.
 */

import type {
	document_verification_status_enum,
	upload_document_type_enum,
} from "generated/prisma";

// ============================================
// Blob Types
// ============================================

export interface FileBlobVM {
	id: string;
	key: string;
	url: string;
	mimeType: string;
	fileName: string;
	sizeBytes: number;
	createdAt: string;
}

// ============================================
// Document Types
// ============================================

export type DocumentType = upload_document_type_enum;
export type DocumentVerificationStatus = document_verification_status_enum;

export interface BookingDocumentVM {
	id: string;
	bookingId: string;
	type: DocumentType;
	note: string | null;
	// New verification fields
	verificationStatus: DocumentVerificationStatus;
	rejectionReason: string | null;
	verifiedAt: string | null;
	verifiedBy: {
		id: string;
		firstName: string;
		lastName: string;
	} | null;
	createdAt: string;
	createdBy: {
		id: string;
		firstName: string;
		lastName: string;
	};
	blob: FileBlobVM;
}

// ============================================
// Verification State Types
// ============================================

export interface DocumentVerificationStateVM {
	serviceFormSigned: DocumentVerificationStatus;
	workspaceFormSigned: DocumentVerificationStatus;
	paymentReceipt: DocumentVerificationStatus;
	requiresWorkspaceForm: boolean;
}

export interface DownloadEligibilityVM {
	isEligible: boolean;
	serviceFormVerified: boolean;
	workspaceFormVerified: boolean;
	paymentVerified: boolean;
	requiresWorkspaceForm: boolean;
	message: string;
}

// ============================================
// Input Types
// ============================================

export interface BookingDocumentUploadInput {
	bookingId: string;
	type: DocumentType;
}

export interface VerifyDocumentInput {
	documentId: string;
	notes?: string;
}

export interface RejectDocumentInput {
	documentId: string;
	reason: string;
}

// ============================================
// Helper Functions
// ============================================

export const documentTypeLabels: Record<DocumentType, string> = {
	service_form_unsigned: "Service Form (Unsigned)",
	service_form_signed: "Signed Service Form",
	workspace_form_unsigned: "Working Area Agreement (Unsigned)",
	workspace_form_signed: "Signed Working Area Agreement",
	payment_receipt: "Payment Receipt",
	sample_result: "Sample Analysis Result",
};

export const verificationStatusLabels: Record<
	DocumentVerificationStatus,
	string
> = {
	pending_upload: "Pending Upload",
	pending_verification: "Under Review",
	verified: "Verified",
	rejected: "Rejected",
	not_required: "Not Required",
};

export const verificationStatusColors: Record<
	DocumentVerificationStatus,
	{ bg: string; text: string; border: string }
> = {
	pending_upload: {
		bg: "bg-slate-100",
		text: "text-slate-600",
		border: "border-slate-200",
	},
	pending_verification: {
		bg: "bg-amber-100",
		text: "text-amber-700",
		border: "border-amber-200",
	},
	verified: {
		bg: "bg-green-100",
		text: "text-green-700",
		border: "border-green-200",
	},
	rejected: {
		bg: "bg-red-100",
		text: "text-red-700",
		border: "border-red-200",
	},
	not_required: {
		bg: "bg-gray-100",
		text: "text-gray-500",
		border: "border-gray-200",
	},
};

export function getDocumentTypeLabel(type: DocumentType): string {
	return documentTypeLabels[type] ?? type;
}

export function getVerificationStatusLabel(
	status: DocumentVerificationStatus,
): string {
	return verificationStatusLabels[status] ?? status;
}

export function isAdminOnlyDocumentType(type: DocumentType): boolean {
	return (
		type === "sample_result" ||
		type === "service_form_unsigned" ||
		type === "workspace_form_unsigned"
	);
}

export function getUserUploadableTypes(): DocumentType[] {
	return ["service_form_signed", "workspace_form_signed", "payment_receipt"];
}

export function getAdminUploadableTypes(): DocumentType[] {
	return ["sample_result", "service_form_unsigned", "workspace_form_unsigned"];
}

export function getSystemGeneratedTypes(): DocumentType[] {
	return ["service_form_unsigned", "workspace_form_unsigned"];
}

export function getVerifiableDocumentTypes(): DocumentType[] {
	return ["service_form_signed", "workspace_form_signed", "payment_receipt"];
}

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
