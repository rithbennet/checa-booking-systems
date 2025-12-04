/**
 * Booking Document Entity
 *
 * Entity for managing uploaded documents associated with bookings.
 * Supports invoice PDFs, signed service forms, workspace forms, and payment receipts.
 */

// API exports (TanStack Query)
export { bookingDocumentKeys, useBookingDocuments } from "./api";

// Model exports (types and helpers)
export type {
	BookingDocumentUploadInput,
	BookingDocumentVM,
	DocumentType,
	FileBlobVM,
} from "./model";
export {
	documentTypeLabels,
	formatFileSize,
	getAdminUploadableTypes,
	getDocumentTypeLabel,
	getUserUploadableTypes,
	isAdminOnlyDocumentType,
} from "./model";
