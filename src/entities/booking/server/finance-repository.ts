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

export type InvoiceStatusSeverity =
	| "overdue"
	| "sent"
	| "pending"
	| "paid"
	| "cancelled";

export type PaymentStatusLabel =
	| "no_receipt"
	| "receipt_pending"
	| "paid"
	| "rejected";

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
	// Invoice summary
	invoiceCount: number;
	totalInvoiced: string;
	mostSevereInvoiceStatus: InvoiceStatusSeverity | null;
	oldestDueDate: string | null;
	// Payment summary
	totalVerifiedPaid: string;
	latestPaymentStatus: PaymentStatusLabel;
	// Gate
	resultsUnlocked: boolean;
}

export interface FinanceOverviewFilters {
	gateStatus?: "locked" | "unlocked";
	invoiceStatus?: string[];
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

function getInvoiceSummary(
	invoices: Array<{
		amount: { toString(): string };
		status: string;
		dueDate: Date;
	}>,
): {
	invoiceCount: number;
	totalInvoiced: string;
	mostSevereInvoiceStatus: InvoiceStatusSeverity | null;
	oldestDueDate: string | null;
} {
	const nonCancelled = invoices.filter((inv) => inv.status !== "cancelled");

	if (nonCancelled.length === 0) {
		return {
			invoiceCount: 0,
			totalInvoiced: "0",
			mostSevereInvoiceStatus: null,
			oldestDueDate: null,
		};
	}

	const totalInvoiced = nonCancelled.reduce(
		(sum, inv) => sum + Number(inv.amount),
		0,
	);

	// Severity order: overdue > sent > pending > paid
	const severityOrder: InvoiceStatusSeverity[] = [
		"overdue",
		"sent",
		"pending",
		"paid",
	];

	let mostSevere: InvoiceStatusSeverity | null = null;
	for (const severity of severityOrder) {
		if (nonCancelled.some((inv) => inv.status === severity)) {
			mostSevere = severity;
			break;
		}
	}

	// Find oldest due date among unpaid invoices
	const unpaid = nonCancelled.filter(
		(inv) => inv.status !== "paid" && inv.status !== "cancelled",
	);
	const oldestDueDate =
		unpaid.length > 0
			? unpaid
					.map((inv) => inv.dueDate)
					.sort((a, b) => a.getTime() - b.getTime())[0]
			: null;

	return {
		invoiceCount: nonCancelled.length,
		totalInvoiced: totalInvoiced.toString(),
		mostSevereInvoiceStatus: mostSevere,
		oldestDueDate: oldestDueDate?.toISOString().split("T")[0] ?? null,
	};
}

function getPaymentSummary(
	payments: Array<{
		amount: { toString(): string };
		status: string;
	}>,
): {
	totalVerifiedPaid: string;
	latestPaymentStatus: PaymentStatusLabel;
} {
	if (payments.length === 0) {
		return {
			totalVerifiedPaid: "0",
			latestPaymentStatus: "no_receipt",
		};
	}

	const verified = payments.filter((p) => p.status === "verified");
	const pending = payments.filter((p) => p.status === "pending");
	const rejected = payments.filter((p) => p.status === "rejected");

	const totalVerifiedPaid = verified.reduce(
		(sum, p) => sum + Number(p.amount),
		0,
	);

	let latestPaymentStatus: PaymentStatusLabel = "no_receipt";

	if (verified.length > 0) {
		latestPaymentStatus = "paid";
	} else if (pending.length > 0) {
		latestPaymentStatus = "receipt_pending";
	} else if (rejected.length > 0) {
		latestPaymentStatus = "rejected";
	}

	return {
		totalVerifiedPaid: totalVerifiedPaid.toString(),
		latestPaymentStatus,
	};
}

// ==============================================================
// Query Functions
// ==============================================================

/**
 * Get finance stats for KPI header
 */
export async function getFinanceStats(): Promise<FinanceStatsVM> {
	const [outstandingInvoices, pendingForms, pendingPayments] =
		await Promise.all([
			// Outstanding and overdue invoices
			db.invoice.findMany({
				where: {
					status: { in: ["pending", "sent", "overdue"] },
				},
				select: {
					amount: true,
					dueDate: true,
					status: true,
				},
			}),
			// Pending form reviews
			db.serviceForm.count({
				where: { status: "signed_forms_uploaded" },
			}),
			// Pending payment verifications
			db.payment.count({
				where: { status: "pending" },
			}),
		]);

	const now = new Date();
	let totalOutstanding = 0;
	let overdueAmount = 0;

	for (const inv of outstandingInvoices) {
		const amount = Number(inv.amount);
		totalOutstanding += amount;

		if (inv.dueDate < now) {
			overdueAmount += amount;
		}
	}

	return {
		totalOutstanding: totalOutstanding.toString(),
		overdueAmount: overdueAmount.toString(),
		pendingFormReviews: pendingForms,
		pendingPaymentVerifications: pendingPayments,
	};
}

/**
 * Get finance overview for all bookings
 */
export async function getFinanceOverview(
	params: FinanceOverviewFilters,
): Promise<{ items: FinanceOverviewVM[]; total: number }> {
	const { gateStatus, invoiceStatus, userType, q, page, pageSize } = params;

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
					facultyRelation: { select: { name: true } },
					departmentRelation: { select: { name: true } },
					companyRelation: { select: { name: true } },
					companyBranch: { select: { name: true } },
				},
			},
			serviceForms: {
				include: {
					invoices: {
						include: {
							payments: true,
						},
					},
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
			? (user.companyRelation?.name ?? user.companyBranch?.name ?? null)
			: (user.ikohza?.name ??
				user.facultyRelation?.name ??
				user.departmentRelation?.name ??
				null);

		// Get forms status
		const formsInfo = getFormsStatus(booking.serviceForms);

		// Collect all invoices and payments
		const allInvoices = booking.serviceForms.flatMap((sf) => sf.invoices);
		const allPayments = allInvoices.flatMap((inv) => inv.payments);

		// Get summaries
		const invoiceSummary = getInvoiceSummary(allInvoices);
		const paymentSummary = getPaymentSummary(allPayments);

		// Calculate gate status
		const totalInvoiced = Number(invoiceSummary.totalInvoiced);
		const totalVerified = Number(paymentSummary.totalVerifiedPaid);
		const resultsUnlocked = totalInvoiced > 0 && totalVerified >= totalInvoiced;

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
			invoiceCount: invoiceSummary.invoiceCount,
			totalInvoiced: invoiceSummary.totalInvoiced,
			mostSevereInvoiceStatus: invoiceSummary.mostSevereInvoiceStatus,
			oldestDueDate: invoiceSummary.oldestDueDate,
			totalVerifiedPaid: paymentSummary.totalVerifiedPaid,
			latestPaymentStatus: paymentSummary.latestPaymentStatus,
			resultsUnlocked,
		};
	});

	// Apply post-query filters
	if (gateStatus) {
		items = items.filter((item) =>
			gateStatus === "unlocked" ? item.resultsUnlocked : !item.resultsUnlocked,
		);
	}

	if (invoiceStatus && invoiceStatus.length > 0) {
		items = items.filter(
			(item) =>
				item.mostSevereInvoiceStatus &&
				invoiceStatus.includes(item.mostSevereInvoiceStatus),
		);
	}

	const total = items.length;

	// Apply pagination
	const startIndex = (page - 1) * pageSize;
	items = items.slice(startIndex, startIndex + pageSize);

	return { items, total };
}

/**
 * Get results on hold - bookings with analysis complete but no verified payment
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
					facultyRelation: { select: { name: true } },
					departmentRelation: { select: { name: true } },
					companyRelation: { select: { name: true } },
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
			serviceForms: {
				include: {
					invoices: {
						include: {
							payments: { where: { status: "verified" } },
						},
					},
				},
			},
		},
	});

	// Filter to only those without verified payment
	const resultsOnHold = bookingsWithCompletedSamples.filter((booking) => {
		const allInvoices = booking.serviceForms.flatMap((sf) => sf.invoices);
		const totalInvoiced = allInvoices.reduce(
			(sum, inv) => sum + Number(inv.amount),
			0,
		);
		const totalVerified = allInvoices
			.flatMap((inv) => inv.payments)
			.reduce((sum, p) => sum + Number(p.amount), 0);

		// Results are on hold if there's unpaid balance
		return totalInvoiced === 0 || totalVerified < totalInvoiced;
	});

	// Map to VMs
	const now = new Date();
	let items: ResultsOnHoldVM[] = resultsOnHold.map((booking) => {
		const user = booking.user;

		// Determine organization
		const isExternal = user.userType === "external_member";
		const organization = isExternal
			? (user.companyRelation?.name ?? user.companyBranch?.name ?? null)
			: (user.ikohza?.name ??
				user.facultyRelation?.name ??
				user.departmentRelation?.name ??
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
		const allInvoices = booking.serviceForms.flatMap((sf) => sf.invoices);
		const totalDue =
			allInvoices.length > 0
				? allInvoices
						.filter(
							(inv) => inv.status !== "cancelled" && inv.status !== "paid",
						)
						.reduce((sum, inv) => sum + Number(inv.amount), 0)
				: Number(booking.totalAmount);

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
			totalDue: totalDue.toString(),
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
