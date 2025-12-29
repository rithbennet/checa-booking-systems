/**
 * User Financials Repository
 * Data access layer for user-facing financial data
 */

import type { payment_status_enum } from "generated/prisma";
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
	// Payment info
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

function determinePaymentStatus(
	payments: Array<{
		status: payment_status_enum;
		verificationNotes: string | null;
	}>,
): {
	status: UserPaymentStatus;
	latestRejectionReason: string | null;
	latestPaymentId: string | null;
} {
	if (payments.length === 0) {
		return {
			status: "unpaid",
			latestRejectionReason: null,
			latestPaymentId: null,
		};
	}

	// Check for any verified payment
	const verifiedPayment = payments.find((p) => p.status === "verified");
	if (verifiedPayment) {
		return {
			status: "verified",
			latestRejectionReason: null,
			latestPaymentId: null,
		};
	}

	// Check for pending payment
	const pendingPayment = payments.find(
		(p) => p.status === "pending_verification",
	);
	if (pendingPayment) {
		return {
			status: "pending_verification",
			latestRejectionReason: null,
			latestPaymentId: null,
		};
	}

	// All payments are rejected
	const latestRejected = payments.find((p) => p.status === "rejected");
	return {
		status: "rejected",
		latestRejectionReason: latestRejected?.verificationNotes ?? null,
		latestPaymentId: null,
	};
}

// ==============================================================
// Query Functions
// ==============================================================

/**
 * Get user's financial records (service forms with payment status)
 * Filters to only show service forms where the user owns the booking
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
				},
			},
			payments: {
				orderBy: { uploadedAt: "desc" },
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

		// Determine payment status
		const paymentInfo = determinePaymentStatus(
			form.payments.map((p) => ({
				status: p.status,
				verificationNotes: p.verificationNotes,
			})),
		);

		// Get latest payment ID if any
		const latestPayment = form.payments[0];

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
			latestPaymentId: latestPayment?.id ?? null,
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
