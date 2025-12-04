/**
 * Booking Document Types
 *
 * Types for the booking document upload feature.
 */

import type { upload_document_type_enum } from "generated/prisma";

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

export interface BookingDocumentVM {
	id: string;
	bookingId: string;
	type: DocumentType;
	note: string | null;
	status: string | null;
	createdAt: string;
	createdBy: {
		id: string;
		firstName: string;
		lastName: string;
	};
	blob: FileBlobVM;
}

// ============================================
// Input Types
// ============================================

export interface BookingDocumentUploadInput {
	bookingId: string;
	type: DocumentType;
}

// ============================================
// Helper Functions
// ============================================

export const documentTypeLabels: Record<DocumentType, string> = {
	invoice: "Invoice",
	service_form_unsigned: "Service Form (Unsigned)",
	service_form_signed: "Signed Service Form",
	workspace_form_unsigned: "Working Area Agreement (Unsigned)",
	workspace_form_signed: "Signed Working Area Agreement",
	payment_receipt: "Payment Receipt",
	sample_result: "Sample Analysis Result",
};

export function getDocumentTypeLabel(type: DocumentType): string {
	return documentTypeLabels[type] ?? type;
}

export function isAdminOnlyDocumentType(type: DocumentType): boolean {
	return (
		type === "invoice" ||
		type === "sample_result" ||
		type === "service_form_unsigned" ||
		type === "workspace_form_unsigned"
	);
}

export function getUserUploadableTypes(): DocumentType[] {
	return ["service_form_signed", "workspace_form_signed", "payment_receipt"];
}

export function getAdminUploadableTypes(): DocumentType[] {
	return [
		"invoice",
		"sample_result",
		"service_form_unsigned",
		"workspace_form_unsigned",
	];
}

export function getSystemGeneratedTypes(): DocumentType[] {
	return ["service_form_unsigned", "workspace_form_unsigned"];
}

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
