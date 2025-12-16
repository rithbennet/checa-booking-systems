/**
 * Payment Server Repository
 * Data access layer for payment operations
 */

import type {
	Prisma,
	payment_method_enum,
	payment_status_enum,
} from "generated/prisma";
import { notifyPaymentVerified } from "@/entities/notification/server/finance.notifications";
import { db } from "@/shared/server/db";
import type {
	PaymentHistoryVM,
	PaymentVM,
	PendingPaymentVM,
} from "../model/types";

// ==============================================================
// Mappers
// ==============================================================

function mapPaymentToVM(
	payment: Prisma.PaymentGetPayload<{
		include: {
			uploadedByUser: {
				select: { id: true; firstName: true; lastName: true };
			};
			verifiedByUser: {
				select: { id: true; firstName: true; lastName: true };
			};
			invoice: {
				include: {
					payments: { where: { status: "verified" } };
					serviceForm: {
						include: {
							bookingRequest: {
								include: {
									user: {
										include: {
											faculty: { select: { name: true } };
											department: { select: { name: true } };
											ikohza: { select: { name: true } };
											company: { select: { name: true } };
											companyBranch: { select: { name: true } };
										};
									};
								};
							};
						};
					};
				};
			};
		};
	}>,
): PaymentVM {
	const invoice = payment.invoice;
	const booking = invoice.serviceForm.bookingRequest;
	const user = booking.user;

	// Calculate verified total for this invoice
	const totalVerified = invoice.payments.reduce(
		(sum, p) => sum + Number(p.amount),
		0,
	);

	// Determine organization
	const isExternal = user.userType === "external_member";
	const organization = isExternal
		? (user.company?.name ?? user.companyBranch?.name ?? null)
		: (user.ikohza?.name ??
			user.faculty?.name ??
			user.department?.name ??
			null);

	return {
		id: payment.id,
		invoiceId: invoice.id,
		invoiceNumber: invoice.invoiceNumber,
		bookingRef: booking.referenceNumber,
		bookingId: booking.id,
		amount: payment.amount.toString(),
		paymentMethod: payment.paymentMethod,
		paymentDate: payment.paymentDate.toISOString().split("T")[0] ?? "",
		referenceNumber: payment.referenceNumber,
		receiptFilePath: payment.receiptFilePath,
		status: payment.status,
		uploadedBy: {
			id: payment.uploadedByUser.id,
			name: `${payment.uploadedByUser.firstName} ${payment.uploadedByUser.lastName}`.trim(),
		},
		uploadedAt: payment.uploadedAt.toISOString(),
		verifiedAt: payment.verifiedAt?.toISOString() ?? null,
		verifiedBy: payment.verifiedByUser
			? {
					id: payment.verifiedByUser.id,
					name: `${payment.verifiedByUser.firstName} ${payment.verifiedByUser.lastName}`.trim(),
				}
			: null,
		verificationNotes: payment.verificationNotes,
		client: {
			id: user.id,
			name: `${user.firstName} ${user.lastName}`.trim(),
			email: user.email,
			userType: user.userType,
		},
		organization,
		invoiceAmount: invoice.amount.toString(),
		invoiceDueDate: invoice.dueDate.toISOString().split("T")[0] ?? "",
		invoiceStatus: invoice.status,
		totalVerifiedForInvoice: totalVerified.toString(),
		invoiceBalance: (Number(invoice.amount) - totalVerified).toString(),
	};
}

function mapToPendingPaymentVM(
	payment: Parameters<typeof mapPaymentToVM>[0],
): PendingPaymentVM {
	const base = mapPaymentToVM(payment);
	const uploadedAt = new Date(base.uploadedAt);
	const now = new Date();
	const age = Math.floor(
		(now.getTime() - uploadedAt.getTime()) / (1000 * 60 * 60 * 24),
	);

	return {
		...base,
		age,
	};
}

function mapToPaymentHistoryVM(
	payment: Parameters<typeof mapPaymentToVM>[0],
): PaymentHistoryVM {
	const base = mapPaymentToVM(payment);
	return {
		...base,
		processedAt: base.verifiedAt ?? base.uploadedAt,
	};
}

// ==============================================================
// Query Functions
// ==============================================================

const paymentInclude = {
	uploadedByUser: {
		select: { id: true, firstName: true, lastName: true },
	},
	verifiedByUser: {
		select: { id: true, firstName: true, lastName: true },
	},
	invoice: {
		include: {
			payments: { where: { status: "verified" as const } },
			serviceForm: {
				include: {
					bookingRequest: {
						include: {
							user: {
								include: {
									faculty: { select: { name: true } },
									department: { select: { name: true } },
									ikohza: { select: { name: true } },
									company: { select: { name: true } },
									companyBranch: { select: { name: true } },
								},
							},
						},
					},
				},
			},
		},
	},
} as const;

/**
 * List pending payments for verification queue
 */
export async function listPendingPayments(params: {
	q?: string;
	method?: payment_method_enum;
	page: number;
	pageSize: number;
}): Promise<{ items: PendingPaymentVM[]; total: number }> {
	const { q, method, page, pageSize } = params;

	const where: Prisma.PaymentWhereInput = {
		status: "pending",
		...(method ? { paymentMethod: method } : {}),
		...(q
			? {
					OR: [
						{
							referenceNumber: { contains: q, mode: "insensitive" },
						},
						{
							invoice: {
								invoiceNumber: { contains: q, mode: "insensitive" },
							},
						},
						{
							invoice: {
								serviceForm: {
									bookingRequest: {
										referenceNumber: { contains: q, mode: "insensitive" },
									},
								},
							},
						},
						{
							invoice: {
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
						},
					],
				}
			: {}),
	};

	const [items, total] = await Promise.all([
		db.payment.findMany({
			where,
			include: paymentInclude,
			orderBy: { uploadedAt: "asc" }, // oldest first for FIFO queue
			skip: (page - 1) * pageSize,
			take: pageSize,
		}),
		db.payment.count({ where }),
	]);

	return {
		items: items.map(mapToPendingPaymentVM),
		total,
	};
}

/**
 * List payment history (verified and rejected)
 */
export async function listPaymentHistory(params: {
	status?: payment_status_enum[];
	method?: payment_method_enum;
	verifierId?: string;
	dateFrom?: string;
	dateTo?: string;
	q?: string;
	page: number;
	pageSize: number;
}): Promise<{ items: PaymentHistoryVM[]; total: number }> {
	const { status, method, verifierId, dateFrom, dateTo, q, page, pageSize } =
		params;

	const where: Prisma.PaymentWhereInput = {
		status: { in: status ?? ["verified", "rejected"] },
		...(method ? { paymentMethod: method } : {}),
		...(verifierId ? { verifiedBy: verifierId } : {}),
		...(dateFrom || dateTo
			? {
					verifiedAt: {
						...(dateFrom ? { gte: new Date(dateFrom) } : {}),
						...(dateTo ? { lte: new Date(dateTo) } : {}),
					},
				}
			: {}),
		...(q
			? {
					OR: [
						{
							referenceNumber: { contains: q, mode: "insensitive" },
						},
						{
							invoice: {
								invoiceNumber: { contains: q, mode: "insensitive" },
							},
						},
						{
							invoice: {
								serviceForm: {
									bookingRequest: {
										referenceNumber: { contains: q, mode: "insensitive" },
									},
								},
							},
						},
					],
				}
			: {}),
	};

	const [items, total] = await Promise.all([
		db.payment.findMany({
			where,
			include: paymentInclude,
			orderBy: { verifiedAt: "desc" },
			skip: (page - 1) * pageSize,
			take: pageSize,
		}),
		db.payment.count({ where }),
	]);

	return {
		items: items.map(mapToPaymentHistoryVM),
		total,
	};
}

/**
 * Get a single payment by ID
 */
export async function getPaymentById(
	paymentId: string,
): Promise<PaymentVM | null> {
	const payment = await db.payment.findUnique({
		where: { id: paymentId },
		include: paymentInclude,
	});

	if (!payment) return null;
	return mapPaymentToVM(payment);
}

// ==============================================================
// Mutation Functions
// ==============================================================

/**
 * Verify a payment
 * - Updates payment status to verified
 * - If invoice is fully paid, updates invoice status
 * - Creates notification for user
 * - Creates audit log
 */
export async function verifyPayment(params: {
	paymentId: string;
	verifierId: string;
	notes?: string;
}): Promise<PaymentVM> {
	const { paymentId, verifierId, notes } = params;

	return db.$transaction(async (tx) => {
		// Get the payment with invoice info
		const payment = await tx.payment.findUniqueOrThrow({
			where: { id: paymentId },
			include: {
				invoice: {
					include: {
						payments: { where: { status: "verified" } },
						serviceForm: {
							include: {
								bookingRequest: {
									select: {
										id: true,
										referenceNumber: true,
										userId: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (payment.status !== "pending") {
			throw new Error("Payment is not pending verification");
		}

		// Update payment status
		const updatedPayment = await tx.payment.update({
			where: { id: paymentId },
			data: {
				status: "verified",
				verifiedBy: verifierId,
				verifiedAt: new Date(),
				verificationNotes: notes ?? null,
			},
			include: paymentInclude,
		});

		// Calculate new total verified
		const currentVerified = payment.invoice.payments.reduce(
			(sum, p) => sum + Number(p.amount),
			0,
		);
		const newTotal = currentVerified + Number(payment.amount);
		const invoiceAmount = Number(payment.invoice.amount);

		// Update invoice status if fully paid
		if (newTotal >= invoiceAmount) {
			await tx.invoice.update({
				where: { id: payment.invoiceId },
				data: { status: "paid" },
			});
		}

		// Create notification
		const booking = payment.invoice.serviceForm.bookingRequest;
		await tx.notification.create({
			data: {
				userId: booking.userId,
				type: "payment_verified",
				relatedEntityType: "payment",
				relatedEntityId: paymentId,
				title: "Payment Verified",
				message: `Your payment of RM ${payment.amount} for booking ${booking.referenceNumber} has been verified.`,
				emailSent: false,
			},
		});

		// Send email notification (outside transaction to not block)
		setTimeout(async () => {
			try {
				await notifyPaymentVerified({
					userId: booking.userId,
					paymentId,
					invoiceNumber: payment.invoice.invoiceNumber,
					amount: `RM ${payment.amount}`,
					paymentDate: payment.paymentDate.toISOString().split("T")[0] ?? "",
					bookingReference: booking.referenceNumber,
					bookingId: booking.id,
				});
			} catch (emailErr) {
				console.error("[Payment] Failed to send verification email:", emailErr);
			}
		}, 0);

		// Create audit log
		await tx.auditLog.create({
			data: {
				userId: verifierId,
				action: "verify_payment",
				entity: "Payment",
				entityId: paymentId,
				metadata: {
					invoiceId: payment.invoiceId,
					bookingId: booking.id,
					amount: payment.amount.toString(),
					notes: notes ?? null,
				},
			},
		});

		return mapPaymentToVM(updatedPayment);
	});
}

/**
 * Reject a payment
 * - Updates payment status to rejected
 * - Creates notification for user with reason
 * - Creates audit log
 */
export async function rejectPayment(params: {
	paymentId: string;
	verifierId: string;
	notes: string;
}): Promise<PaymentVM> {
	const { paymentId, verifierId, notes } = params;

	if (!notes || notes.trim().length === 0) {
		throw new Error("Rejection reason is required");
	}

	return db.$transaction(async (tx) => {
		// Get the payment
		const payment = await tx.payment.findUniqueOrThrow({
			where: { id: paymentId },
			include: {
				invoice: {
					include: {
						serviceForm: {
							include: {
								bookingRequest: {
									select: {
										id: true,
										referenceNumber: true,
										userId: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (payment.status !== "pending") {
			throw new Error("Payment is not pending verification");
		}

		// Update payment status
		const updatedPayment = await tx.payment.update({
			where: { id: paymentId },
			data: {
				status: "rejected",
				verifiedBy: verifierId,
				verifiedAt: new Date(),
				verificationNotes: notes,
			},
			include: paymentInclude,
		});

		// Create notification
		const booking = payment.invoice.serviceForm.bookingRequest;
		await tx.notification.create({
			data: {
				userId: booking.userId,
				type: "payment_reminder",
				relatedEntityType: "payment",
				relatedEntityId: paymentId,
				title: "Payment Rejected",
				message: `Your payment for booking ${booking.referenceNumber} was rejected. Reason: ${notes}. Please upload a new receipt.`,
				emailSent: false,
			},
		});

		// Create audit log
		await tx.auditLog.create({
			data: {
				userId: verifierId,
				action: "reject_payment",
				entity: "Payment",
				entityId: paymentId,
				metadata: {
					invoiceId: payment.invoiceId,
					bookingId: booking.id,
					amount: payment.amount.toString(),
					reason: notes,
				},
			},
		});

		return mapPaymentToVM(updatedPayment);
	});
}

/**
 * Create a manual payment (admin recording offline payment)
 */
export async function createManualPayment(params: {
	invoiceId: string;
	amount: string;
	paymentMethod: payment_method_enum;
	paymentDate: string;
	referenceNumber?: string;
	receiptFilePath: string;
	adminId: string;
	notes?: string;
}): Promise<PaymentVM> {
	const {
		invoiceId,
		amount,
		paymentMethod,
		paymentDate,
		referenceNumber,
		receiptFilePath,
		adminId,
		notes,
	} = params;

	return db.$transaction(async (tx) => {
		// Get invoice to validate
		const invoice = await tx.invoice.findUniqueOrThrow({
			where: { id: invoiceId },
			include: {
				payments: { where: { status: "verified" } },
				serviceForm: {
					include: {
						bookingRequest: {
							select: { id: true, referenceNumber: true, userId: true },
						},
					},
				},
			},
		});

		// Create payment as verified (since admin is recording it)
		const payment = await tx.payment.create({
			data: {
				invoiceId,
				amount: parseFloat(amount),
				paymentMethod,
				paymentDate: new Date(paymentDate),
				referenceNumber: referenceNumber ?? null,
				receiptFilePath,
				status: "verified",
				uploadedBy: adminId,
				uploadedAt: new Date(),
				verifiedBy: adminId,
				verifiedAt: new Date(),
				verificationNotes: notes ?? "Recorded manually by admin",
			},
			include: paymentInclude,
		});

		// Check if invoice is now fully paid
		const currentVerified = invoice.payments.reduce(
			(sum, p) => sum + Number(p.amount),
			0,
		);
		const newTotal = currentVerified + parseFloat(amount);

		if (newTotal >= Number(invoice.amount)) {
			await tx.invoice.update({
				where: { id: invoiceId },
				data: { status: "paid" },
			});
		}

		// Create audit log
		await tx.auditLog.create({
			data: {
				userId: adminId,
				action: "create_manual_payment",
				entity: "Payment",
				entityId: payment.id,
				metadata: {
					invoiceId,
					bookingId: invoice.serviceForm.bookingRequest.id,
					amount,
					method: paymentMethod,
				},
			},
		});

		return mapPaymentToVM(payment);
	});
}
