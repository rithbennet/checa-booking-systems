/**
 * Payment Receipt Repository
 * Handles payment receipt documents from bookingDocuments table
 */

import type { Prisma, payment_method_enum } from "generated/prisma";
import { db } from "@/shared/server/db";
import type { PaymentReceiptVM } from "../model/types";

/**
 * Parse payment metadata from document note JSON
 */
function parsePaymentMetadata(
	note: string | null,
	documentId: string,
): {
	amount?: number;
	paymentMethod?: payment_method_enum;
	paymentDate?: string;
	referenceNumber?: string | null;
} {
	if (!note) {
		return {};
	}

	try {
		return JSON.parse(note);
	} catch (err) {
		console.warn(`Failed to parse note for document ${documentId}:`, err);
		return {};
	}
}

/**
 * List pending payment receipts for verification
 */
export async function listPendingPaymentReceipts(params: {
	q?: string;
	method?: payment_method_enum;
	page: number;
	pageSize: number;
}): Promise<{ items: PaymentReceiptVM[]; total: number }> {
	const { q, method, page, pageSize } = params;

	// Note: The `note` field is stored as plain text (not JSON type) in PostgreSQL.
	// We use string contains matching for DB-level filtering, then validate parsed JSON
	// in application code for correctness. This is a limitation of the current schema.
	// Consider migrating `note` to a proper JSON column for better query performance.
	const methodCondition = method
		? {
				note: {
					contains: `"paymentMethod":"${method}"`,
				},
			}
		: {};

	const where: Prisma.BookingDocumentWhereInput = {
		type: "payment_receipt",
		verificationStatus: "pending_verification",
		...methodCondition,
		...(q
			? {
					OR: [
						{
							booking: {
								referenceNumber: { contains: q, mode: "insensitive" },
							},
						},
						{
							booking: {
								user: {
									OR: [
										{ firstName: { contains: q, mode: "insensitive" } },
										{ lastName: { contains: q, mode: "insensitive" } },
										{ email: { contains: q, mode: "insensitive" } },
									],
								},
							},
						},
						{
							booking: {
								serviceForms: {
									some: {
										formNumber: { contains: q, mode: "insensitive" },
									},
								},
							},
						},
					],
				}
			: {}),
	};

	const [documents, total] = await Promise.all([
		db.bookingDocument.findMany({
			where,
			include: {
				blob: true,
				booking: {
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
						serviceForms: {
							orderBy: { createdAt: "desc" as const },
							take: 1,
							select: { formNumber: true },
						},
					},
				},
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
			orderBy: { createdAt: "asc" as const }, // FIFO
			skip: (page - 1) * pageSize,
			take: pageSize,
		}),
		db.bookingDocument.count({ where }),
	]);

	const now = new Date();

	return {
		items: documents.map((doc) => {
			const metadata = parsePaymentMetadata(doc.note, doc.id);
			const user = doc.booking.user;
			const isExternal = user.userType === "external_member";

			return {
				id: doc.id,
				bookingId: doc.booking.id,
				bookingRef: doc.booking.referenceNumber,
				formNumber: doc.booking.serviceForms[0]?.formNumber || "N/A",

				amount: metadata.amount?.toString() || "0",
				paymentMethod: (metadata.paymentMethod || "eft") as payment_method_enum,
				paymentDate: metadata.paymentDate || doc.createdAt.toISOString(),
				referenceNumber: metadata.referenceNumber || null,

				verificationStatus: doc.verificationStatus as
					| "pending_verification"
					| "verified"
					| "rejected",
				rejectionReason: doc.rejectionReason,

				receiptUrl: doc.blob.url,
				fileName: doc.blob.fileName,
				mimeType: doc.blob.mimeType,

				client: {
					id: user.id,
					name: `${user.firstName} ${user.lastName}`.trim(),
					email: user.email,
					userType: user.userType,
				},
				organization: isExternal
					? (user.company?.name ?? user.companyBranch?.name ?? null)
					: (user.ikohza?.name ??
						user.faculty?.name ??
						user.department?.name ??
						null),

				uploadedBy: {
					id: doc.createdBy.id,
					name: `${doc.createdBy.firstName} ${doc.createdBy.lastName}`.trim(),
				},
				uploadedAt: doc.createdAt.toISOString(),

				verifiedBy: doc.verifiedByUser
					? {
							id: doc.verifiedByUser.id,
							name:
								`${doc.verifiedByUser.firstName} ${doc.verifiedByUser.lastName}`.trim() ||
								"Unknown",
						}
					: doc.verifiedBy
						? {
								id: doc.verifiedBy,
								name: "Unknown",
							}
						: null,
				verifiedAt: doc.verifiedAt?.toISOString() || null,

				age: Math.ceil(
					(now.getTime() - doc.createdAt.getTime()) / (1000 * 60 * 60 * 24),
				),
			};
		}),
		total,
	};
}

/**
 * List payment receipt history (verified/rejected)
 */
export async function listPaymentReceiptHistory(params: {
	status?: ("verified" | "rejected")[];
	dateFrom?: string;
	dateTo?: string;
	q?: string;
	method?: payment_method_enum;
	page: number;
	pageSize: number;
}): Promise<{ items: PaymentReceiptVM[]; total: number }> {
	const { status, dateFrom, dateTo, q, method, page, pageSize } = params;

	const statusFilter =
		status && status.length > 0 ? status : ["verified", "rejected"];

	// Note: The `note` field is stored as plain text (not JSON type) in PostgreSQL.
	// We use string contains matching for DB-level filtering, then validate parsed JSON
	// in application code for correctness. This is a limitation of the current schema.
	// Consider migrating `note` to a proper JSON column for better query performance.
	const methodCondition = method
		? {
				note: {
					contains: `"paymentMethod":"${method}"`,
				},
			}
		: {};

	const where: Prisma.BookingDocumentWhereInput = {
		type: "payment_receipt",
		verificationStatus: {
			in: statusFilter as Prisma.Enumdocument_verification_status_enumFilter["in"],
		},
		...methodCondition,
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
							booking: {
								referenceNumber: { contains: q, mode: "insensitive" },
							},
						},
						{
							booking: {
								user: {
									OR: [
										{ firstName: { contains: q, mode: "insensitive" } },
										{ lastName: { contains: q, mode: "insensitive" } },
										{ email: { contains: q, mode: "insensitive" } },
									],
								},
							},
						},
						{
							booking: {
								serviceForms: {
									some: {
										formNumber: { contains: q, mode: "insensitive" },
									},
								},
							},
						},
					],
				}
			: {}),
	};

	const [documents, total] = await Promise.all([
		db.bookingDocument.findMany({
			where,
			include: {
				blob: true,
				booking: {
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
						serviceForms: {
							orderBy: { createdAt: "desc" as const },
							take: 1,
							select: { formNumber: true },
						},
					},
				},
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
			orderBy: { verifiedAt: "desc" as const },
			skip: (page - 1) * pageSize,
			take: pageSize,
		}),
		db.bookingDocument.count({ where }),
	]);

	const now = new Date();

	return {
		items: documents.map((doc) => {
			const metadata = parsePaymentMetadata(doc.note, doc.id);
			const user = doc.booking.user;
			const isExternal = user.userType === "external_member";

			return {
				id: doc.id,
				bookingId: doc.booking.id,
				bookingRef: doc.booking.referenceNumber,
				formNumber: doc.booking.serviceForms[0]?.formNumber || "N/A",

				amount: metadata.amount?.toString() || "0",
				paymentMethod: (metadata.paymentMethod || "eft") as payment_method_enum,
				paymentDate: metadata.paymentDate || doc.createdAt.toISOString(),
				referenceNumber: metadata.referenceNumber || null,

				verificationStatus: doc.verificationStatus as
					| "pending_verification"
					| "verified"
					| "rejected",
				rejectionReason: doc.rejectionReason,

				receiptUrl: doc.blob.url,
				fileName: doc.blob.fileName,
				mimeType: doc.blob.mimeType,

				client: {
					id: user.id,
					name: `${user.firstName} ${user.lastName}`.trim(),
					email: user.email,
					userType: user.userType,
				},
				organization: isExternal
					? (user.company?.name ?? user.companyBranch?.name ?? null)
					: (user.ikohza?.name ??
						user.faculty?.name ??
						user.department?.name ??
						null),

				uploadedBy: {
					id: doc.createdBy.id,
					name: `${doc.createdBy.firstName} ${doc.createdBy.lastName}`.trim(),
				},
				uploadedAt: doc.createdAt.toISOString(),

				verifiedBy: doc.verifiedByUser
					? {
							id: doc.verifiedByUser.id,
							name:
								`${doc.verifiedByUser.firstName} ${doc.verifiedByUser.lastName}`.trim() ||
								"Unknown",
						}
					: doc.verifiedBy
						? {
								id: doc.verifiedBy,
								name: "Unknown",
							}
						: null,
				verifiedAt: doc.verifiedAt?.toISOString() || null,

				age: Math.ceil(
					(now.getTime() - doc.createdAt.getTime()) / (1000 * 60 * 60 * 24),
				),
			};
		}),
		total,
	};
}
