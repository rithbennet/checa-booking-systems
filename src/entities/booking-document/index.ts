/**
 * Booking Document Entity
 *
 * Entity for managing uploaded documents associated with bookings.
 * Supports invoice PDFs, signed service forms, workspace forms, and payment receipts.
 */

// API exports (TanStack Query)
export {
	bookingDocumentKeys,
	useBookingDocuments,
	useDocumentVerificationState,
	useDownloadEligibility,
	usePaymentReceiptHistory,
	usePendingPaymentReceipts,
	useRejectDocument,
	useRejectPayment,
	useRejectPaymentReceipt,
	useVerifyDocument,
	useVerifyPayment,
	useVerifyPaymentReceipt,
} from "./api";

// Model exports (types and helpers)
export type {
	BookingDocumentUploadInput,
	BookingDocumentVM,
	DocumentType,
	DocumentVerificationStateVM,
	DocumentVerificationStatus,
	DownloadEligibilityVM,
	FileBlobVM,
	PaymentReceiptVM,
	RejectDocumentInput,
	VerifyDocumentInput,
} from "./model";
export {
	documentTypeLabels,
	formatFileSize,
	getAdminUploadableTypes,
	getDocumentTypeLabel,
	getSystemGeneratedTypes,
	getUserUploadableTypes,
	getVerifiableDocumentTypes,
	getVerificationStatusLabel,
	isAdminOnlyDocumentType,
	verificationStatusColors,
	verificationStatusLabels,
} from "./model";

// UI exports (components)
export {
	DocumentVerificationCard,
	type DocumentVerificationCardProps,
	VerificationStatusBadge,
} from "./ui";
