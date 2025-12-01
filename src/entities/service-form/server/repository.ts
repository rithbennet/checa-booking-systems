/**
 * ServiceForm Server Repository
 * Data access layer for service form operations
 */

import type { Prisma } from "generated/prisma";
import { db } from "@/shared/server/db";
import type { ServiceFormListFilters, ServiceFormListVM } from "../model/types";

// ==============================================================
// Query Functions
// ==============================================================

/**
 * List service forms for review
 */
export async function listServiceFormsForReview(
	params: ServiceFormListFilters,
): Promise<{ items: ServiceFormListVM[]; total: number }> {
	const { status, bookingId, hasInvoice, q, page, pageSize } = params;

	const where: Prisma.ServiceFormWhereInput = {
		...(status && status.length > 0 ? { status: { in: status } } : {}),
		...(bookingId ? { bookingRequestId: bookingId } : {}),
		...(q
			? {
					OR: [
						{ formNumber: { contains: q, mode: "insensitive" } },
						{
							bookingRequest: {
								referenceNumber: { contains: q, mode: "insensitive" },
							},
						},
						{
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
					],
				}
			: {}),
	};

	const [forms, total] = await Promise.all([
		db.serviceForm.findMany({
			where,
			include: {
				bookingRequest: {
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
					},
				},
				invoices: {
					select: {
						id: true,
						invoiceNumber: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
			skip: (page - 1) * pageSize,
			take: pageSize,
		}),
		db.serviceForm.count({ where }),
	]);

	const now = new Date();
	let items: ServiceFormListVM[] = forms.map((form) => {
		const booking = form.bookingRequest;
		const user = booking.user;

		// Determine organization
		const isExternal = user.userType === "external_member";
		const organization = isExternal
			? (user.companyRelation?.name ?? user.companyBranch?.name ?? null)
			: (user.ikohza?.name ??
				user.facultyRelation?.name ??
				user.departmentRelation?.name ??
				null);

		const isExpired = form.validUntil < now;

		return {
			id: form.id,
			formNumber: form.formNumber,
			facilityLab: form.facilityLab,
			subtotal: form.subtotal.toString(),
			totalAmount: form.totalAmount.toString(),
			validUntil: form.validUntil.toISOString().split("T")[0] ?? "",
			status: form.status,
			hasUnsignedForm: Boolean(form.serviceFormUnsignedPdfPath),
			hasSignedForm: Boolean(form.serviceFormSignedPdfPath),
			requiresWorkingAreaAgreement: form.requiresWorkingAreaAgreement,
			hasUnsignedWorkspaceForm: Boolean(
				form.workingAreaAgreementUnsignedPdfPath,
			),
			hasSignedWorkspaceForm: Boolean(form.workingAreaAgreementSignedPdfPath),
			serviceFormUnsignedPdfPath: form.serviceFormUnsignedPdfPath,
			serviceFormSignedPdfPath: form.serviceFormSignedPdfPath,
			workingAreaAgreementUnsignedPdfPath:
				form.workingAreaAgreementUnsignedPdfPath,
			workingAreaAgreementSignedPdfPath: form.workingAreaAgreementSignedPdfPath,
			bookingId: booking.id,
			bookingRef: booking.referenceNumber,
			client: {
				id: user.id,
				name: `${user.firstName} ${user.lastName}`.trim(),
				email: user.email,
				userType: user.userType,
			},
			organization,
			hasInvoice: form.invoices.length > 0,
			invoiceNumber: form.invoices[0]?.invoiceNumber ?? null,
			invoiceCount: form.invoices.length,
			generatedAt: form.generatedAt.toISOString(),
			downloadedAt: form.downloadedAt?.toISOString() ?? null,
			signedFormsUploadedAt: form.signedFormsUploadedAt?.toISOString() ?? null,
			isExpired,
		};
	});

	// Apply post-query filter for hasInvoice
	if (hasInvoice !== undefined) {
		items = items.filter((item) =>
			hasInvoice ? item.hasInvoice : !item.hasInvoice,
		);
	}

	return { items, total };
}

/**
 * Get service forms awaiting review (signed_forms_uploaded status)
 */
export async function getFormsAwaitingReview(params: {
	q?: string;
	page: number;
	pageSize: number;
}): Promise<{ items: ServiceFormListVM[]; total: number }> {
	return listServiceFormsForReview({
		...params,
		status: ["signed_forms_uploaded"],
	});
}
