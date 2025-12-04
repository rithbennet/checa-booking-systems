/**
 * Booking Document Server Repository
 *
 * Data access layer for booking documents.
 */

import { db } from "@/shared/server/db";
import type { BookingDocumentVM, DocumentType } from "../model/types";

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
		},
		orderBy: { createdAt: "desc" },
	});

	return documents.map((doc) => ({
		id: doc.id,
		bookingId: doc.bookingId,
		type: doc.type as DocumentType,
		note: doc.note,
		status: doc.status,
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
	}));
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
		},
	});

	if (!doc) return null;

	return {
		id: doc.id,
		bookingId: doc.bookingId,
		type: doc.type as DocumentType,
		note: doc.note,
		status: doc.status,
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
		},
		orderBy: { createdAt: "desc" },
	});

	return documents.map((doc) => ({
		id: doc.id,
		bookingId: doc.bookingId,
		type: doc.type as DocumentType,
		note: doc.note,
		status: doc.status,
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
	}));
}

/**
 * Get the most recent document of each type for a booking
 * Useful for showing current state of uploaded documents
 */
export async function getLatestDocumentsByType(
	bookingId: string,
): Promise<Record<DocumentType, BookingDocumentVM | null>> {
	const types: DocumentType[] = [
		"invoice",
		"service_form_unsigned",
		"service_form_signed",
		"workspace_form_unsigned",
		"workspace_form_signed",
		"payment_receipt",
		"sample_result",
	];

	const result: Record<DocumentType, BookingDocumentVM | null> = {
		invoice: null,
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
			},
			orderBy: { createdAt: "desc" },
		});

		if (doc) {
			result[type] = {
				id: doc.id,
				bookingId: doc.bookingId,
				type: doc.type as DocumentType,
				note: doc.note,
				status: doc.status,
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
			booking: {
				select: {
					userId: true,
				},
			},
		},
	});

	if (!doc) return null;

	return {
		document: {
			id: doc.id,
			bookingId: doc.bookingId,
			type: doc.type as DocumentType,
			note: doc.note,
			status: doc.status,
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
		},
		bookingOwnerId: doc.booking.userId,
	};
}
