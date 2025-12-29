/**
 * Finance Repository
 * Data access layer for financial overview and reporting
 */

import type { Prisma } from "generated/prisma";
import { db } from "@/shared/server/db";

// ==============================================================
// Finance Stats Types
// ==============================================================

export interface FinanceStatsVM {
	totalOutstanding: string;
	overdueAmount: string;
	pendingFormReviews: number;
	pendingPaymentVerifications: number;
}

// ==============================================================
// Finance Overview Types
// ==============================================================

export type FormsStatusLabel =
	| "none"
	| "awaiting_signature"
	| "awaiting_review"
	| "completed"
	| "expired";

export type PaymentStatusSeverity = "unpaid" | "pending" | "paid";

export type PaymentStatusLabel =
	| "no_receipt"
	| "receipt_pending"
	| "paid"
	| "rejected";

interface PaymentSummaryResult {
	totalVerifiedPaid: string;
	paymentStatus: PaymentStatusSeverity;
	latestPaymentStatusLabel: PaymentStatusLabel;
}

function getPaymentSummary(
	payments: Array<{ status: string; amount: unknown }>,
	totalAmount: number,
): PaymentSummaryResult {
	const verifiedPayments = payments.filter((p) => p.status === "verified");
	const totalVerifiedPaid = verifiedPayments.reduce(
		(sum, p) => sum + Number(p.amount),
		0,
	);

	// Determine payment status severity
	let paymentStatus: PaymentStatusSeverity = "unpaid";
	if (totalVerifiedPaid >= totalAmount && totalAmount > 0) {
		paymentStatus = "paid";
	} else if (payments.some((p) => p.status === "pending_verification")) {
		paymentStatus = "pending";
	}

	// Determine latest payment status label
	let latestPaymentStatusLabel: PaymentStatusLabel = "no_receipt";
	if (payments.length > 0) {
		const latestPayment = payments[payments.length - 1];
		if (latestPayment) {
			if (latestPayment.status === "verified") {
				latestPaymentStatusLabel = "paid";
			} else if (latestPayment.status === "rejected") {
				latestPaymentStatusLabel = "rejected";
			} else if (latestPayment.status === "pending_verification") {
				latestPaymentStatusLabel = "receipt_pending";
			}
		}
	}

	return {
		totalVerifiedPaid: totalVerifiedPaid.toString(),
		paymentStatus,
		latestPaymentStatusLabel,
	};
}

export interface FinanceOverviewVM {
	id: string;
	referenceNumber: string;
	status: string;
	createdAt: string;
	// User
	client: {
		id: string;
		name: string;
		email: string;
		userType: string;
	};
	organization: string | null;
	// Forms status
	formsStatus: FormsStatusLabel;
	hasServiceFormSigned: boolean;
	hasWorkspaceFormSigned: boolean;
	requiresWorkspaceForm: boolean;
	// Payment summary
	totalAmount: string;
	totalVerifiedPaid: string;
	paymentStatus: PaymentStatusSeverity;
	latestPaymentStatusLabel: PaymentStatusLabel;
	// Gate
	resultsUnlocked: boolean;
}

export interface FinanceOverviewFilters {
	gateStatus?: "locked" | "unlocked";
	paymentStatus?: string[];
	userType?: string;
	q?: string;
	page: number;
	pageSize: number;
}

// ==============================================================
// Results on Hold Types
// ==============================================================

export interface ResultsOnHoldVM {
	id: string;
	referenceNumber: string;
	client: {
		id: string;
		name: string;
		email: string;
		userType: string;
	};
	organization: string | null;
	samplesCompleted: number;
	totalDue: string;
	daysSinceFirstCompletion: number;
	earliestCompletionDate: string;
}

// ==============================================================
// Helper Functions
// ==============================================================

function getFormsStatus(
	serviceForms: Array<{
		status: string;
		serviceFormSignedPdfPath: string | null;
		workingAreaAgreementSignedPdfPath: string | null;
		requiresWorkingAreaAgreement: boolean;
		validUntil: Date;
	}>,
): {
	status: FormsStatusLabel;
	hasServiceFormSigned: boolean;
	hasWorkspaceFormSigned: boolean;
	requiresWorkspaceForm: boolean;
} {
	if (serviceForms.length === 0) {
		return {
			status: "none",
			hasServiceFormSigned: false,
			hasWorkspaceFormSigned: false,
			requiresWorkspaceForm: false,
		};
	}

	// Get the latest form
	const latestForm = serviceForms[serviceForms.length - 1];
	if (!latestForm) {
		return {
			status: "none",
			hasServiceFormSigned: false,
			hasWorkspaceFormSigned: false,
			requiresWorkspaceForm: false,
		};
	}

	const hasServiceFormSigned = Boolean(latestForm.serviceFormSignedPdfPath);
	const hasWorkspaceFormSigned = Boolean(
		latestForm.workingAreaAgreementSignedPdfPath,
	);
	const requiresWorkspaceForm = latestForm.requiresWorkingAreaAgreement;

	// Check if expired
	if (latestForm.validUntil < new Date()) {
		return {
			status: "expired",
			hasServiceFormSigned,
			hasWorkspaceFormSigned,
			requiresWorkspaceForm,
		};
	}

	// Determine status based on form status
	if (latestForm.status === "signed_forms_uploaded") {
		return {
			status: "awaiting_review",
			hasServiceFormSigned,
			hasWorkspaceFormSigned,
			requiresWorkspaceForm,
		};
	}

	if (latestForm.status === "generated" || latestForm.status === "downloaded") {
		return {
			status: "awaiting_signature",
			hasServiceFormSigned,
			hasWorkspaceFormSigned,
			requiresWorkspaceForm,
		};
	}

	// If signed forms are present, consider completed
	if (hasServiceFormSigned) {
		return {
			status: "completed",
			hasServiceFormSigned,
			hasWorkspaceFormSigned,
			requiresWorkspaceForm,
		};
	}

	return {
		status: "awaiting_signature",
		hasServiceFormSigned,
		hasWorkspaceFormSigned,
		requiresWorkspaceForm,
	};
}

// ==============================================================
// Query Functions
// ==============================================================

/**
 * Get finance stats for KPI header
 */
export async function getFinanceStats(): Promise<FinanceStatsVM> {
	const [pendingForms, pendingPayments, pendingDocVerifications] =
		await Promise.all([
			// Pending form reviews
			db.serviceForm.count({
				where: { status: "signed_forms_uploaded" },
			}),
			// Pending payment verifications (legacy direct payment records)
			db.payment.count({
				where: { status: "pending_verification" },
			}),
			// Pending document verifications (new flow - payment receipts)
			db.bookingDocument.count({
				where: {
					type: "payment_receipt",
					verificationStatus: "pending_verification",
				},
			}),
		]);

	// Calculate outstanding amounts from bookings with verified service forms
	const bookingsWithForms = await db.bookingRequest.findMany({
		where: {
			status: { notIn: ["draft", "cancelled", "rejected"] },
			serviceForms: {
				some: {
					status: { in: ["signed_forms_uploaded", "generated", "downloaded"] },
				},
			},
		},
		include: {
			serviceForms: {
				include: {
					payments: {
						where: { status: "verified" },
					},
				},
			},
		},
	});

	let totalOutstanding = 0;
	let overdueAmount = 0;
	const now = new Date();

	for (const booking of bookingsWithForms) {
		const latestForm = booking.serviceForms[booking.serviceForms.length - 1];
		if (!latestForm) continue;

		const formAmount = Number(latestForm.totalAmount);
		const paidAmount = latestForm.payments.reduce(
			(sum, p) => sum + Number(p.amount),
			0,
		);
		const outstanding = formAmount - paidAmount;

		if (outstanding > 0) {
			totalOutstanding += outstanding;

			// Check if overdue (form expired)
			if (latestForm.validUntil < now) {
				overdueAmount += outstanding;
			}
		}
	}

	return {
		totalOutstanding: totalOutstanding.toString(),
		overdueAmount: overdueAmount.toString(),
		pendingFormReviews: pendingForms,
		// Combine legacy payment verifications and new document verifications
		pendingPaymentVerifications: pendingPayments + pendingDocVerifications,
	};
}

/**
 * Get finance overview for all bookings
 */
export async function getFinanceOverview(
	params: FinanceOverviewFilters,
): Promise<{ items: FinanceOverviewVM[]; total: number }> {
	const { gateStatus, paymentStatus, userType, q, page, pageSize } = params;

	// Build where clause
	const where: Prisma.BookingRequestWhereInput = {
		// Only show bookings that have at least been submitted
		status: { notIn: ["draft"] },
		...(userType
			? {
					user: {
						userType: userType as Prisma.Enumuser_type_enumFilter["equals"],
					},
				}
			: {}),
		...(q
			? {
					OR: [
						{ referenceNumber: { contains: q, mode: "insensitive" } },
						{
							user: {
								OR: [
									{ firstName: { contains: q, mode: "insensitive" } },
									{ lastName: { contains: q, mode: "insensitive" } },
									{ email: { contains: q, mode: "insensitive" } },
								],
							},
						},
					],
				}
			: {}),
	};

	const bookings = await db.bookingRequest.findMany({
		where,
		include: {
			user: {
				include: {
					ikohza: { select: { name: true } },
					faculty: { select: { name: true } },
					department: { select: { name: true } },
					company: { select: { name: true } },
					companyBranch: { select: { name: true } },
				},
			},
			// Include documents for verification check
			bookingDocuments: {
				select: {
					type: true,
					verificationStatus: true,
				},
			},
			// Include workspace bookings to check if workspace form is required
			workspaceBookings: {
				select: { id: true },
			},
			serviceForms: {
				include: {
					payments: true,
				},
				orderBy: { createdAt: "asc" },
			},
		},
		orderBy: { createdAt: "desc" },
	});

	// Map to VMs and apply post-query filters
	let items: FinanceOverviewVM[] = bookings.map((booking) => {
		const user = booking.user;

		// Determine organization
		const isExternal = user.userType === "external_member";
		const organization = isExternal
			? (user.company?.name ?? user.companyBranch?.name ?? null)
			: (user.ikohza?.name ??
				user.faculty?.name ??
				user.department?.name ??
				null);

		// Get forms status
		const formsInfo = getFormsStatus(booking.serviceForms);

		// Collect all payments
		const allPayments = booking.serviceForms.flatMap((sf) => sf.payments);

		// Get summaries
		const totalAmount = Number(booking.totalAmount);
		const paymentSummary = getPaymentSummary(allPayments, totalAmount);

		// Result Gatekeeper: Check document verification status
		// Results are unlocked when all required documents are verified
		const hasWorkspaceService = booking.workspaceBookings.length > 0;

		let serviceFormVerified = false;
		let workspaceFormVerified = false;
		let paymentReceiptVerified = false;

		for (const doc of booking.bookingDocuments) {
			if (doc.verificationStatus === "verified") {
				if (doc.type === "service_form_signed") {
					serviceFormVerified = true;
				} else if (doc.type === "workspace_form_signed") {
					workspaceFormVerified = true;
				} else if (doc.type === "payment_receipt") {
					paymentReceiptVerified = true;
				}
			}
		}

		const workspaceFormOk = !hasWorkspaceService || workspaceFormVerified;
		const resultsUnlocked =
			serviceFormVerified && workspaceFormOk && paymentReceiptVerified;

		return {
			id: booking.id,
			referenceNumber: booking.referenceNumber,
			status: booking.status,
			createdAt: booking.createdAt.toISOString(),
			client: {
				id: user.id,
				name: `${user.firstName} ${user.lastName}`.trim(),
				email: user.email,
				userType: user.userType,
			},
			organization,
			formsStatus: formsInfo.status,
			hasServiceFormSigned: formsInfo.hasServiceFormSigned,
			hasWorkspaceFormSigned: formsInfo.hasWorkspaceFormSigned,
			requiresWorkspaceForm: formsInfo.requiresWorkspaceForm,
			totalAmount: totalAmount.toString(),
			totalVerifiedPaid: paymentSummary.totalVerifiedPaid,
			paymentStatus: paymentSummary.paymentStatus,
			latestPaymentStatusLabel: paymentSummary.latestPaymentStatusLabel,
			resultsUnlocked,
		};
	});

	// Apply post-query filters
	if (gateStatus) {
		items = items.filter((item) =>
			gateStatus === "unlocked" ? item.resultsUnlocked : !item.resultsUnlocked,
		);
	}

	if (paymentStatus && paymentStatus.length > 0) {
		items = items.filter((item) => paymentStatus.includes(item.paymentStatus));
	}

	const total = items.length;

	// Apply pagination
	const startIndex = (page - 1) * pageSize;
	items = items.slice(startIndex, startIndex + pageSize);

	return { items, total };
}

/**
 * Get results on hold - bookings with analysis complete but documents not verified
 * Uses the new Document Verification flow: results are locked until all required
 * documents (service form, workspace form if applicable, payment receipt) are verified.
 */
export async function getResultsOnHold(params: {
	q?: string;
	page: number;
	pageSize: number;
}): Promise<{ items: ResultsOnHoldVM[]; total: number }> {
	const { q, page, pageSize } = params;

	// Find bookings that have completed samples
	const bookingsWithCompletedSamples = await db.bookingRequest.findMany({
		where: {
			serviceItems: {
				some: {
					sampleTracking: {
						some: {
							status: "analysis_complete",
						},
					},
				},
			},
			...(q
				? {
						OR: [
							{ referenceNumber: { contains: q, mode: "insensitive" } },
							{
								user: {
									OR: [
										{ firstName: { contains: q, mode: "insensitive" } },
										{ lastName: { contains: q, mode: "insensitive" } },
									],
								},
							},
						],
					}
				: {}),
		},
		include: {
			user: {
				include: {
					ikohza: { select: { name: true } },
					faculty: { select: { name: true } },
					department: { select: { name: true } },
					company: { select: { name: true } },
					companyBranch: { select: { name: true } },
				},
			},
			serviceItems: {
				include: {
					sampleTracking: {
						where: { status: "analysis_complete" },
						orderBy: { analysisCompleteAt: "asc" },
					},
				},
			},
			// Include documents for verification check
			bookingDocuments: {
				select: {
					type: true,
					verificationStatus: true,
				},
			},
			// Include workspace bookings to check if workspace form is required
			workspaceBookings: {
				select: { id: true },
			},
			serviceForms: {
				select: {
					totalAmount: true,
					payments: {
						where: { status: "verified" },
					},
				},
			},
		},
	});

	// Filter to only those where documents are NOT fully verified (results locked)
	const resultsOnHold = bookingsWithCompletedSamples.filter((booking) => {
		const hasWorkspaceService = booking.workspaceBookings.length > 0;

		let serviceFormVerified = false;
		let workspaceFormVerified = false;
		let paymentReceiptVerified = false;

		for (const doc of booking.bookingDocuments) {
			if (doc.verificationStatus === "verified") {
				if (doc.type === "service_form_signed") {
					serviceFormVerified = true;
				} else if (doc.type === "workspace_form_signed") {
					workspaceFormVerified = true;
				} else if (doc.type === "payment_receipt") {
					paymentReceiptVerified = true;
				}
			}
		}

		const workspaceFormOk = !hasWorkspaceService || workspaceFormVerified;
		const resultsUnlocked =
			serviceFormVerified && workspaceFormOk && paymentReceiptVerified;

		// Include in "on hold" if results are NOT unlocked
		return !resultsUnlocked;
	});

	// Map to VMs
	const now = new Date();
	let items: ResultsOnHoldVM[] = resultsOnHold.map((booking) => {
		const user = booking.user;

		// Determine organization
		const isExternal = user.userType === "external_member";
		const organization = isExternal
			? (user.company?.name ?? user.companyBranch?.name ?? null)
			: (user.ikohza?.name ??
				user.faculty?.name ??
				user.department?.name ??
				null);

		// Count completed samples and find earliest completion
		const completedSamples = booking.serviceItems.flatMap(
			(si) => si.sampleTracking,
		);
		const samplesCompleted = completedSamples.length;

		const completionDates = completedSamples
			.map((s) => s.analysisCompleteAt)
			.filter(Boolean) as Date[];
		const earliestCompletion =
			completionDates.length > 0
				? completionDates.sort((a, b) => a.getTime() - b.getTime())[0]
				: null;

		const daysSinceFirstCompletion = earliestCompletion
			? Math.floor(
					(now.getTime() - earliestCompletion.getTime()) /
						(1000 * 60 * 60 * 24),
				)
			: 0;

		// Calculate total due
		const allPayments = booking.serviceForms.flatMap((sf) => sf.payments);
		const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
		const totalDue = Number(booking.totalAmount) - totalPaid;

		return {
			id: booking.id,
			referenceNumber: booking.referenceNumber,
			client: {
				id: user.id,
				name: `${user.firstName} ${user.lastName}`.trim(),
				email: user.email,
				userType: user.userType,
			},
			organization,
			samplesCompleted,
			totalDue: totalDue > 0 ? totalDue.toString() : "0",
			daysSinceFirstCompletion,
			earliestCompletionDate:
				earliestCompletion?.toISOString().split("T")[0] ?? "",
		};
	});

	const total = items.length;

	// Apply pagination
	const startIndex = (page - 1) * pageSize;
	items = items.slice(startIndex, startIndex + pageSize);

	return { items, total };
}
