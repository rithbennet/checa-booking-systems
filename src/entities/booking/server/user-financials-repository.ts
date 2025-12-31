/**
 * User Financials Repository
 * Data access layer for user-facing financial data
 *
 * Note: Payment tracking has been migrated to use BookingDocument with type "payment_receipt"
 * instead of a separate Payment model.
 */

import type { document_verification_status_enum } from "generated/prisma";
import { db } from "@/shared/server/db";

// ==============================================================
// Types
// ==============================================================

export type UserPaymentStatus =
	| "unpaid"
	| "pending_verification"
	| "verified"
	| "rejected";

export interface UserFinancialVM {
	id: string; // ServiceForm ID
	bookingId: string;
	bookingRef: string;
	formNumber: string;
	formFilePath: string;
	amount: string;
	validUntil: string;
	createdAt: string;
	// Payment info (derived from booking documents)
	paymentStatus: UserPaymentStatus;
	latestPaymentId: string | null;
	latestPaymentRejectionReason: string | null;
}

export interface UserFinancialSummary {
	totalOutstanding: string;
	totalPending: string;
	totalPaid: string;
}

export interface UserFinancialsResponse {
	items: UserFinancialVM[];
	summary: UserFinancialSummary;
}

// ==============================================================
// Helper Functions
// ==============================================================

function determinePaymentStatusFromDocuments(
	paymentDocs: Array<{
		id: string;
		verificationStatus: document_verification_status_enum;
		rejectionReason: string | null;
	}>,
): {
	status: UserPaymentStatus;
	latestRejectionReason: string | null;
	latestPaymentId: string | null;
} {
	if (paymentDocs.length === 0) {
		return {
			status: "unpaid",
			latestRejectionReason: null,
			latestPaymentId: null,
		};
	}

	// Check for any verified payment
	const verifiedDoc = paymentDocs.find(
		(d) => d.verificationStatus === "verified",
	);
	if (verifiedDoc) {
		return {
			status: "verified",
			latestRejectionReason: null,
			latestPaymentId: verifiedDoc.id,
		};
	}

	// Check for pending payment
	const pendingDoc = paymentDocs.find(
		(d) => d.verificationStatus === "pending_verification",
	);
	if (pendingDoc) {
		return {
			status: "pending_verification",
			latestRejectionReason: null,
			latestPaymentId: pendingDoc.id,
		};
	}

	// Check for pending_upload documents (payment not yet submitted)
	const pendingUploadDoc = paymentDocs.find(
		(d) => d.verificationStatus === "pending_upload",
	);
	if (pendingUploadDoc) {
		return {
			status: "unpaid",
			latestRejectionReason: null,
			latestPaymentId: pendingUploadDoc.id,
		};
	}

	// Check for rejected documents
	const latestRejected = paymentDocs.find(
		(d) => d.verificationStatus === "rejected",
	);
	if (latestRejected) {
		return {
			status: "rejected",
			latestRejectionReason: latestRejected.rejectionReason ?? null,
			latestPaymentId: latestRejected.id,
		};
	}

	// No documents found or all are in unknown states
	return {
		status: "unpaid",
		latestRejectionReason: null,
		latestPaymentId: null,
	};
}

// ==============================================================
// Query Functions
// ==============================================================

/**
 * Get user's financial records (service forms with payment status)
 * Filters to only show service forms where the user owns the booking
 *
 * Payment status is now derived from BookingDocument with type "payment_receipt"
 */
export async function getUserFinancials(
	userId: string,
): Promise<UserFinancialsResponse> {
	// Fetch all service forms for bookings owned by this user
	const serviceForms = await db.serviceForm.findMany({
		where: {
			bookingRequest: {
				userId,
			},
			// Only show active forms
			status: { notIn: ["expired"] },
		},
		include: {
			bookingRequest: {
				select: {
					id: true,
					referenceNumber: true,
					// Get payment receipt documents
					bookingDocuments: {
						where: {
							type: "payment_receipt",
						},
						select: {
							id: true,
							verificationStatus: true,
							rejectionReason: true,
							createdAt: true,
						},
						orderBy: { createdAt: "desc" },
					},
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	// Calculate summary
	let totalOutstanding = 0;
	let totalPending = 0;
	let totalPaid = 0;

	// Map to VMs
	const items: UserFinancialVM[] = serviceForms.map((form) => {
		const booking = form.bookingRequest;
		const amount = Number(form.totalAmount);

		// Determine payment status from booking documents
		const paymentInfo = determinePaymentStatusFromDocuments(
			booking.bookingDocuments.map((doc) => ({
				id: doc.id,
				verificationStatus: doc.verificationStatus,
				rejectionReason: doc.rejectionReason,
			})),
		);

		// Update summary based on status
		if (paymentInfo.status === "verified") {
			totalPaid += amount;
		} else if (paymentInfo.status === "pending_verification") {
			totalPending += amount;
		} else {
			// unpaid or rejected
			totalOutstanding += amount;
		}

		return {
			id: form.id,
			bookingId: booking.id,
			bookingRef: booking.referenceNumber,
			formNumber: form.formNumber,
			formFilePath: form.serviceFormUnsignedPdfPath,
			amount: amount.toString(),
			validUntil: form.validUntil.toISOString().split("T")[0] ?? "",
			createdAt: form.createdAt.toISOString(),
			paymentStatus: paymentInfo.status,
			latestPaymentId: paymentInfo.latestPaymentId,
			latestPaymentRejectionReason: paymentInfo.latestRejectionReason,
		};
	});

	return {
		items,
		summary: {
			totalOutstanding: totalOutstanding.toString(),
			totalPending: totalPending.toString(),
			totalPaid: totalPaid.toString(),
		},
	};
}
