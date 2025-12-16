/**
 * Invoice Server Repository
 * Data access layer for invoice operations
 */

import type { invoice_status_enum, Prisma } from "generated/prisma";
import { db } from "@/shared/server/db";

// ==============================================================
// Types
// ==============================================================

export interface InvoiceListVM {
	id: string;
	invoiceNumber: string;
	serviceFormId: string;
	formNumber: string;
	bookingId: string;
	bookingRef: string;
	client: {
		id: string;
		name: string;
		email: string;
		userType: string;
	};
	organization: string | null;
	invoiceDate: string;
	dueDate: string;
	amount: string;
	status: invoice_status_enum;
	filePath: string;
	uploadedBy: {
		id: string;
		name: string;
	};
	uploadedAt: string;
	// Payment info
	totalPaid: string;
	balance: string;
	paymentCount: number;
	latestPaymentStatus: string | null;
	isOverdue: boolean;
}

export interface InvoiceListFilters {
	status?: invoice_status_enum[];
	bookingId?: string;
	serviceFormId?: string;
	dueDateFrom?: string;
	dueDateTo?: string;
	q?: string;
	page: number;
	pageSize: number;
}

// ==============================================================
// Query Functions
// ==============================================================

/**
 * List invoices with filters
 */
export async function listInvoices(
	params: InvoiceListFilters,
): Promise<{ items: InvoiceListVM[]; total: number }> {
	const {
		status,
		bookingId,
		serviceFormId,
		dueDateFrom,
		dueDateTo,
		q,
		page,
		pageSize,
	} = params;

	const where: Prisma.InvoiceWhereInput = {
		...(status && status.length > 0 ? { status: { in: status } } : {}),
		...(serviceFormId ? { serviceFormId } : {}),
		...(bookingId
			? {
					serviceForm: {
						bookingRequestId: bookingId,
					},
				}
			: {}),
		...(dueDateFrom || dueDateTo
			? {
					dueDate: {
						...(dueDateFrom ? { gte: new Date(dueDateFrom) } : {}),
						...(dueDateTo ? { lte: new Date(dueDateTo) } : {}),
					},
				}
			: {}),
		...(q
			? {
					OR: [
						{ invoiceNumber: { contains: q, mode: "insensitive" } },
						{
							serviceForm: {
								formNumber: { contains: q, mode: "insensitive" },
							},
						},
						{
							serviceForm: {
								bookingRequest: {
									referenceNumber: { contains: q, mode: "insensitive" },
								},
							},
						},
						{
							serviceForm: {
								bookingRequest: {
									user: {
										OR: [
											{ firstName: { contains: q, mode: "insensitive" } },
											{ lastName: { contains: q, mode: "insensitive" } },
											{ email: { contains: q, mode: "insensitive" } },
										],
									},
								},
							},
						},
					],
				}
			: {}),
	};

	const [invoices, total] = await Promise.all([
		db.invoice.findMany({
			where,
			include: {
				uploadedByUser: {
					select: { id: true, firstName: true, lastName: true },
				},
				payments: true,
				serviceForm: {
					include: {
						bookingRequest: {
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
							},
						},
					},
				},
			},
			orderBy: { createdAt: "desc" },
			skip: (page - 1) * pageSize,
			take: pageSize,
		}),
		db.invoice.count({ where }),
	]);

	const now = new Date();
	const items: InvoiceListVM[] = invoices.map((invoice) => {
		const booking = invoice.serviceForm.bookingRequest;
		const user = booking.user;

		// Determine organization
		const isExternal = user.userType === "external_member";
		const organization = isExternal
			? (user.company?.name ?? user.companyBranch?.name ?? null)
			: (user.ikohza?.name ??
				user.faculty?.name ??
				user.department?.name ??
				null);

		// Calculate payment info
		const verifiedPayments = invoice.payments.filter(
			(p) => p.status === "verified",
		);
		const totalPaid = verifiedPayments.reduce(
			(sum, p) => sum + Number(p.amount),
			0,
		);
		const balance = Number(invoice.amount) - totalPaid;

		// Find latest payment status
		const latestPayment = invoice.payments
			.filter((p) => p.status !== "rejected")
			.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0];

		const isOverdue =
			invoice.status !== "paid" &&
			invoice.status !== "cancelled" &&
			invoice.dueDate < now;

		return {
			id: invoice.id,
			invoiceNumber: invoice.invoiceNumber,
			serviceFormId: invoice.serviceFormId,
			formNumber: invoice.serviceForm.formNumber,
			bookingId: booking.id,
			bookingRef: booking.referenceNumber,
			client: {
				id: user.id,
				name: `${user.firstName} ${user.lastName}`.trim(),
				email: user.email,
				userType: user.userType,
			},
			organization,
			invoiceDate: invoice.invoiceDate.toISOString().split("T")[0] ?? "",
			dueDate: invoice.dueDate.toISOString().split("T")[0] ?? "",
			amount: invoice.amount.toString(),
			status: invoice.status,
			filePath: invoice.filePath,
			uploadedBy: {
				id: invoice.uploadedByUser.id,
				name: `${invoice.uploadedByUser.firstName} ${invoice.uploadedByUser.lastName}`.trim(),
			},
			uploadedAt: invoice.uploadedAt.toISOString(),
			totalPaid: totalPaid.toString(),
			balance: balance.toString(),
			paymentCount: invoice.payments.length,
			latestPaymentStatus: latestPayment?.status ?? null,
			isOverdue,
		};
	});

	return { items, total };
}

// ==============================================================
// Mutation Functions
// ==============================================================

/**
 * Update invoice due date
 */
export async function updateInvoiceDueDate(params: {
	invoiceId: string;
	dueDate: string;
	adminId: string;
}): Promise<InvoiceListVM> {
	const { invoiceId, dueDate, adminId } = params;

	await db.$transaction(async (tx) => {
		await tx.invoice.update({
			where: { id: invoiceId },
			data: { dueDate: new Date(dueDate) },
		});

		await tx.auditLog.create({
			data: {
				userId: adminId,
				action: "update_invoice_due_date",
				entity: "Invoice",
				entityId: invoiceId,
				metadata: { newDueDate: dueDate },
			},
		});
	});

	// Fetch and return updated invoice
	const result = await listInvoices({ page: 1, pageSize: 1 });
	const updated = result.items.find((i) => i.id === invoiceId);
	if (!updated) {
		throw new Error("Invoice not found after update");
	}
	return updated;
}

/**
 * Cancel an invoice
 */
export async function cancelInvoice(params: {
	invoiceId: string;
	adminId: string;
	reason?: string;
}): Promise<void> {
	const { invoiceId, adminId, reason } = params;

	await db.$transaction(async (tx) => {
		// Check for verified payments
		const invoice = await tx.invoice.findUniqueOrThrow({
			where: { id: invoiceId },
			include: {
				payments: { where: { status: "verified" } },
			},
		});

		if (invoice.payments.length > 0) {
			throw new Error("Cannot cancel invoice with verified payments");
		}

		await tx.invoice.update({
			where: { id: invoiceId },
			data: { status: "cancelled" },
		});

		await tx.auditLog.create({
			data: {
				userId: adminId,
				action: "cancel_invoice",
				entity: "Invoice",
				entityId: invoiceId,
				metadata: { reason: reason ?? "Cancelled by admin" },
			},
		});
	});
}
