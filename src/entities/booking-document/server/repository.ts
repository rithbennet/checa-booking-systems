/**
 * Booking Document Server Repository
 *
 * Data access layer for booking documents.
 */

import { db } from "@/shared/server/db";
import type {
	BookingDocumentVM,
	DocumentType,
	DocumentVerificationStateVM,
	DownloadEligibilityVM,
} from "../model/types";

/**
 * Map raw Prisma document to VM
 */
function mapDocumentToVM(doc: {
	id: string;
	bookingId: string;
	type: DocumentType;
	note: string | null;
	verificationStatus: string;
	rejectionReason: string | null;
	verifiedAt: Date | null;
	verifiedByUser: { id: string; firstName: string; lastName: string } | null;
	createdAt: Date;
	createdBy: { id: string; firstName: string; lastName: string };
	blob: {
		id: string;
		key: string;
		url: string;
		mimeType: string;
		fileName: string;
		sizeBytes: number;
		createdAt: Date;
	};
}): BookingDocumentVM {
	return {
		id: doc.id,
		bookingId: doc.bookingId,
		type: doc.type,
		note: doc.note,
		verificationStatus:
			doc.verificationStatus as BookingDocumentVM["verificationStatus"],
		rejectionReason: doc.rejectionReason,
		verifiedAt: doc.verifiedAt?.toISOString() ?? null,
		verifiedBy: doc.verifiedByUser
			? {
					id: doc.verifiedByUser.id,
					firstName: doc.verifiedByUser.firstName,
					lastName: doc.verifiedByUser.lastName,
				}
			: null,
		createdAt: doc.createdAt.toISOString(),
		createdBy: {
			id: doc.createdBy.id,
			firstName: doc.createdBy.firstName,
			lastName: doc.createdBy.lastName,
		},
		blob: {
			id: doc.blob.id,
			key: doc.blob.key,
			url: doc.blob.url,
			mimeType: doc.blob.mimeType,
			fileName: doc.blob.fileName,
			sizeBytes: doc.blob.sizeBytes,
			createdAt: doc.blob.createdAt.toISOString(),
		},
	};
}

/**
 * Get all documents for a booking
 */
export async function getBookingDocuments(
	bookingId: string,
): Promise<BookingDocumentVM[]> {
	const documents = await db.bookingDocument.findMany({
		where: { bookingId },
		include: {
			blob: true,
			createdBy: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
				},
			},
			verifiedByUser: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	return documents.map(mapDocumentToVM);
}

/**
 * Get a single document by ID
 */
export async function getBookingDocumentById(
	id: string,
): Promise<BookingDocumentVM | null> {
	const doc = await db.bookingDocument.findUnique({
		where: { id },
		include: {
			blob: true,
			createdBy: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
				},
			},
			verifiedByUser: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
				},
			},
		},
	});

	if (!doc) return null;

	return mapDocumentToVM(doc);
}

/**
 * Get documents of a specific type for a booking
 */
export async function getBookingDocumentsByType(
	bookingId: string,
	type: DocumentType,
): Promise<BookingDocumentVM[]> {
	const documents = await db.bookingDocument.findMany({
		where: { bookingId, type },
		include: {
			blob: true,
			createdBy: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
				},
			},
			verifiedByUser: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	return documents.map(mapDocumentToVM);
}

/**
 * Get the most recent document of each type for a booking
 * Useful for showing current state of uploaded documents
 */
export async function getLatestDocumentsByType(
	bookingId: string,
): Promise<Record<DocumentType, BookingDocumentVM | null>> {
	const types: DocumentType[] = [
		"service_form_unsigned",
		"service_form_signed",
		"workspace_form_unsigned",
		"workspace_form_signed",
		"payment_receipt",
		"sample_result",
	];

	const result: Record<DocumentType, BookingDocumentVM | null> = {
		service_form_unsigned: null,
		service_form_signed: null,
		workspace_form_unsigned: null,
		workspace_form_signed: null,
		payment_receipt: null,
		sample_result: null,
	};

	for (const type of types) {
		const doc = await db.bookingDocument.findFirst({
			where: { bookingId, type },
			include: {
				blob: true,
				createdBy: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
				verifiedByUser: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		if (doc) {
			result[type] = mapDocumentToVM(doc);
		}
	}

	return result;
}

/**
 * Check if user has access to a booking document
 * Returns the booking owner ID for ownership checks
 */
export async function getDocumentWithBookingOwner(
	documentId: string,
): Promise<{ document: BookingDocumentVM; bookingOwnerId: string } | null> {
	const doc = await db.bookingDocument.findUnique({
		where: { id: documentId },
		include: {
			blob: true,
			createdBy: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
				},
			},
			verifiedByUser: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
				},
			},
			booking: {
				select: {
					userId: true,
				},
			},
		},
	});

	if (!doc) return null;

	return {
		document: mapDocumentToVM(doc),
		bookingOwnerId: doc.booking.userId,
	};
}

/**
 * Get document verification state for a booking
 * Returns the verification status of each key document type
 */
export async function getDocumentVerificationState(
	bookingId: string,
): Promise<DocumentVerificationStateVM> {
	// Check if booking requires workspace form
	const booking = await db.bookingRequest.findUnique({
		where: { id: bookingId },
		select: {
			workspaceBookings: { take: 1 },
		},
	});

	const requiresWorkspaceForm = (booking?.workspaceBookings.length ?? 0) > 0;

	// Get latest documents of each verifiable type
	const [serviceFormSigned, workspaceFormSigned, paymentReceipt] =
		await Promise.all([
			db.bookingDocument.findFirst({
				where: { bookingId, type: "service_form_signed" },
				orderBy: { createdAt: "desc" },
				select: { verificationStatus: true },
			}),
			db.bookingDocument.findFirst({
				where: { bookingId, type: "workspace_form_signed" },
				orderBy: { createdAt: "desc" },
				select: { verificationStatus: true },
			}),
			db.bookingDocument.findFirst({
				where: { bookingId, type: "payment_receipt" },
				orderBy: { createdAt: "desc" },
				select: { verificationStatus: true },
			}),
		]);

	return {
		serviceFormSigned:
			serviceFormSigned?.verificationStatus ?? "pending_upload",
		workspaceFormSigned: requiresWorkspaceForm
			? (workspaceFormSigned?.verificationStatus ?? "pending_upload")
			: "not_required",
		paymentReceipt: paymentReceipt?.verificationStatus ?? "pending_upload",
		requiresWorkspaceForm,
	};
}

/**
 * Check if user can download analysis results for a booking
 * THE RESULT GATEKEEPER - enforces all verification requirements
 */
export async function checkDownloadEligibility(
	bookingId: string,
): Promise<DownloadEligibilityVM> {
	const state = await getDocumentVerificationState(bookingId);

	const serviceFormVerified = state.serviceFormSigned === "verified";
	const workspaceFormVerified =
		state.workspaceFormSigned === "verified" ||
		state.workspaceFormSigned === "not_required";
	const paymentVerified = state.paymentReceipt === "verified";

	const isEligible =
		serviceFormVerified && workspaceFormVerified && paymentVerified;

	// Generate user-friendly message
	let message: string;
	if (isEligible) {
		message = "All documents verified. Results are available for download.";
	} else {
		const pending: string[] = [];
		if (!serviceFormVerified) pending.push("Signed Service Form");
		if (!workspaceFormVerified) pending.push("Signed Working Area Agreement");
		if (!paymentVerified) pending.push("Payment Receipt");
		message = `Results are locked. Awaiting verification of: ${pending.join(", ")}.`;
	}

	return {
		isEligible,
		serviceFormVerified,
		workspaceFormVerified,
		paymentVerified,
		requiresWorkspaceForm: state.requiresWorkspaceForm,
		message,
	};
}

/**
 * Verify a document (admin action)
 */
export async function verifyDocument(
	documentId: string,
	adminId: string,
	notes?: string,
): Promise<BookingDocumentVM> {
	const doc = await db.bookingDocument.update({
		where: { id: documentId },
		data: {
			verificationStatus: "verified",
			verifiedAt: new Date(),
			verifiedBy: adminId,
			note: notes ? `${notes}` : undefined,
		},
		include: {
			blob: true,
			createdBy: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
				},
			},
			verifiedByUser: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
				},
			},
		},
	});

	return mapDocumentToVM(doc);
}

/**
 * Reject a document (admin action)
 */
export async function rejectDocument(
	documentId: string,
	adminId: string,
	reason: string,
): Promise<BookingDocumentVM> {
	const doc = await db.bookingDocument.update({
		where: { id: documentId },
		data: {
			verificationStatus: "rejected",
			rejectionReason: reason,
			verifiedAt: new Date(),
			verifiedBy: adminId,
		},
		include: {
			blob: true,
			createdBy: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
				},
			},
			verifiedByUser: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
				},
			},
		},
	});

	return mapDocumentToVM(doc);
}

/**
 * Get all documents pending verification for admin review
 */
export async function getPendingVerificationDocuments(): Promise<
	BookingDocumentVM[]
> {
	const documents = await db.bookingDocument.findMany({
		where: {
			verificationStatus: "pending_verification",
			type: {
				in: ["service_form_signed", "workspace_form_signed", "payment_receipt"],
			},
		},
		include: {
			blob: true,
			createdBy: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
				},
			},
			verifiedByUser: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
				},
			},
		},
		orderBy: { createdAt: "asc" }, // Oldest first for FIFO processing
	});

	return documents.map(mapDocumentToVM);
}
