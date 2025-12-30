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
	| "pending_verification"
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
	documents: Array<{ type: string; verificationStatus: string | null }>,
): PaymentSummaryResult {
	// Primary source: bookingDocuments payment_receipt verification status
	const paymentReceiptDoc = documents.find(
		(doc) => doc.type === "payment_receipt",
	);
	const hasPaymentReceipt = paymentReceiptDoc !== undefined;
	const paymentReceiptVerified =
		paymentReceiptDoc?.verificationStatus === "verified";
	const paymentReceiptPending =
		paymentReceiptDoc?.verificationStatus === "pending_verification";
	const paymentReceiptRejected =
		paymentReceiptDoc?.verificationStatus === "rejected";

	// Legacy: calculate verified payments from old payment records
	const verifiedPayments = payments.filter((p) => p.status === "verified");
	const totalVerifiedPaid = verifiedPayments.reduce(
		(sum, p) => sum + Number(p.amount),
		0,
	);

	// Determine payment status severity
	// Prioritize new document-based flow
	let paymentStatus: PaymentStatusSeverity = "unpaid";
	if (
		paymentReceiptVerified ||
		(totalVerifiedPaid >= totalAmount && totalAmount > 0)
	) {
		paymentStatus = "paid";
	} else if (paymentReceiptPending) {
		paymentStatus = "pending";
	}

	// Determine latest payment status label (prioritize new document flow)
	let latestPaymentStatusLabel: PaymentStatusLabel = "no_receipt";
	if (hasPaymentReceipt) {
		if (paymentReceiptVerified) {
			latestPaymentStatusLabel = "paid";
		} else if (paymentReceiptRejected) {
			latestPaymentStatusLabel = "rejected";
		} else if (paymentReceiptPending) {
			latestPaymentStatusLabel = "pending_verification";
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
	documents: Array<{
		type: string;
		verificationStatus: string | null;
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

	// Check document verification status
	const serviceFormVerified = documents.some(
		(doc) =>
			doc.type === "service_form_signed" &&
			doc.verificationStatus === "verified",
	);
	const workspaceFormVerified = documents.some(
		(doc) =>
			doc.type === "workspace_form_signed" &&
			doc.verificationStatus === "verified",
	);

	// Check if documents are uploaded and pending verification
	const serviceFormPendingReview = documents.some(
		(doc) =>
			doc.type === "service_form_signed" &&
			doc.verificationStatus === "pending_verification",
	);
	const workspaceFormPendingReview = documents.some(
		(doc) =>
			doc.type === "workspace_form_signed" &&
			doc.verificationStatus === "pending_verification",
	);

	// If documents are verified, forms are completed
	const requiredDocsVerified =
		serviceFormVerified && (!requiresWorkspaceForm || workspaceFormVerified);

	if (requiredDocsVerified) {
		return {
			status: "completed",
			hasServiceFormSigned,
			hasWorkspaceFormSigned,
			requiresWorkspaceForm,
		};
	}

	// If documents are uploaded and pending review
	// Show pending review if:
	// - Service form is pending, OR
	// - Workspace form is pending (when required), OR
	// - Old status is signed_forms_uploaded
	const hasAnyDocsPending =
		serviceFormPendingReview ||
		(requiresWorkspaceForm && workspaceFormPendingReview);

	if (hasAnyDocsPending || latestForm.status === "signed_forms_uploaded") {
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
	const [pendingForms, pendingDocVerifications] = await Promise.all([
		// Pending form reviews
		db.serviceForm.count({
			where: { status: "signed_forms_uploaded" },
		}),
		// Pending payment receipt verifications from bookingDocuments
		db.bookingDocument.count({
			where: {
				type: "payment_receipt",
				verificationStatus: "pending_verification",
			},
		}),
	]);

	// Calculate outstanding amounts from bookings with service forms
	// Note: With the new flow, we check payment receipt verification status
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
				orderBy: { createdAt: "desc" },
				take: 1,
			},
			bookingDocuments: {
				where: {
					type: "payment_receipt",
					verificationStatus: "verified",
				},
			},
		},
	});

	let totalOutstanding = 0;
	let overdueAmount = 0;
	const now = new Date();

	for (const booking of bookingsWithForms) {
		const latestForm = booking.serviceForms[0];
		if (!latestForm) continue;

		const formAmount = Number(latestForm.totalAmount);
		// If there's a verified payment receipt, consider it paid
		const hasVerifiedPayment = booking.bookingDocuments.length > 0;
		const outstanding = hasVerifiedPayment ? 0 : formAmount;

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
		pendingPaymentVerifications: pendingDocVerifications,
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

		// Get forms status (passing documents for verification check)
		const formsInfo = getFormsStatus(
			booking.serviceForms,
			booking.bookingDocuments,
		);

		// Note: Payment data is tracked via bookingDocuments, not ServiceForm
		// Get summaries
		const totalAmount = Number(booking.totalAmount);
		const paymentSummary = getPaymentSummary(
			[],
			totalAmount,
			booking.bookingDocuments,
		);

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

		// Calculate total due - payment info is in bookingDocuments
		const totalDue = Number(booking.totalAmount);

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
