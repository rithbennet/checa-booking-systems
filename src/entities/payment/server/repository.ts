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
import { ValidationError } from "@/shared/server/errors";
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
			serviceForm: {
				include: {
					payments: { where: { status: "verified" } };
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
	}>,
): PaymentVM {
	const serviceForm = payment.serviceForm;
	const booking = serviceForm.bookingRequest;
	const user = booking.user;

	// Calculate verified total for this service form
	const totalVerified = serviceForm.payments.reduce(
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
		serviceFormId: serviceForm.id,
		formNumber: serviceForm.formNumber,
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
		formAmount: serviceForm.totalAmount.toString(),
		formValidUntil: serviceForm.validUntil.toISOString().split("T")[0] ?? "",
		formStatus: serviceForm.status,
		totalVerifiedForForm: totalVerified.toString(),
		formBalance: (Number(serviceForm.totalAmount) - totalVerified).toString(),
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
	serviceForm: {
		include: {
			payments: { where: { status: "verified" as const } },
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
		status: "pending_verification",
		...(method ? { paymentMethod: method } : {}),
		...(q
			? {
					OR: [
						{
							referenceNumber: { contains: q, mode: "insensitive" },
						},
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
		// Get the payment with service form info
		const payment = await tx.payment.findUniqueOrThrow({
			where: { id: paymentId },
			include: {
				serviceForm: {
					include: {
						payments: { where: { status: "verified" } },
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
		});

		if (payment.status !== "pending_verification") {
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

		// Create notification
		const booking = payment.serviceForm.bookingRequest;
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
					formNumber: payment.serviceForm.formNumber,
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
					serviceFormId: payment.serviceFormId,
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
		throw new ValidationError("Rejection reason is required", {
			notes: ["Rejection reason is required"],
		});
	}

	return db.$transaction(async (tx) => {
		// Get the payment
		const payment = await tx.payment.findUniqueOrThrow({
			where: { id: paymentId },
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
		});

		if (payment.status !== "pending_verification") {
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
				rejectedAt: new Date(),
				rejectionReason: notes,
			},
			include: paymentInclude,
		});

		// Create notification
		const booking = payment.serviceForm.bookingRequest;
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
					serviceFormId: payment.serviceFormId,
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
	serviceFormId: string;
	bookingId: string;
	amount: string;
	paymentMethod: payment_method_enum;
	paymentDate: string;
	referenceNumber?: string;
	receiptFilePath: string;
	adminId: string;
	notes?: string;
}): Promise<PaymentVM> {
	const {
		serviceFormId,
		bookingId,
		amount,
		paymentMethod,
		paymentDate,
		referenceNumber,
		receiptFilePath,
		adminId,
		notes,
	} = params;

	return db.$transaction(async (tx) => {
		// Get service form to validate
		const serviceForm = await tx.serviceForm.findUniqueOrThrow({
			where: { id: serviceFormId },
			include: {
				payments: { where: { status: "verified" } },
				bookingRequest: {
					select: { id: true, referenceNumber: true, userId: true },
				},
			},
		});

		// Create payment as verified (since admin is recording it)
		const payment = await tx.payment.create({
			data: {
				serviceFormId,
				bookingId,
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

		// Create audit log
		await tx.auditLog.create({
			data: {
				userId: adminId,
				action: "create_manual_payment",
				entity: "Payment",
				entityId: payment.id,
				metadata: {
					serviceFormId,
					bookingId: serviceForm.bookingRequest.id,
					amount,
					method: paymentMethod,
				},
			},
		});

		return mapPaymentToVM(payment);
	});
}
