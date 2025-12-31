/**
 * User Booking Detail Server Repository
 *
 * Fetches booking data for the user detail view.
 * Enforces ownership and excludes admin-only data.
 */

import type { document_verification_status_enum } from "generated/prisma";
import type { Decimal } from "generated/prisma/runtime/library";
import { db } from "@/shared/server/db";
import type {
	UserBookingDetailVM,
	UserModificationVM,
} from "../model/user-detail-types";

function decimalToString(value: Decimal | null | undefined): string {
	return value?.toString() ?? "0";
}

function dateToISOString(date: Date | null | undefined): string | null {
	return date?.toISOString() ?? null;
}

/**
 * Check if all required documents are verified for result download
 * Result Gatekeeper: All documents must be verified before results can be downloaded
 */
function checkDocumentVerificationForDownload(
	documents: Array<{
		type: string;
		verificationStatus: document_verification_status_enum | null;
	}>,
	hasWorkspaceService: boolean,
): boolean {
	let serviceFormVerified = false;
	let workspaceFormVerified = false;
	let paymentReceiptVerified = false;

	for (const doc of documents) {
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

	// Workspace form is only required if booking has workspace service
	const workspaceFormOk = !hasWorkspaceService || workspaceFormVerified;

	return serviceFormVerified && workspaceFormOk && paymentReceiptVerified;
}

/**
 * Get user booking detail data with ownership check
 */
export async function getUserBookingDetailData(
	bookingId: string,
	userId: string,
): Promise<UserBookingDetailVM | null> {
	const booking = await db.bookingRequest.findUnique({
		where: {
			id: bookingId,
			userId: userId, // Enforce ownership
		},
		include: {
			// Include documents for verification check
			bookingDocuments: {
				select: {
					type: true,
					verificationStatus: true,
					verifiedAt: true,
				},
			},
			serviceItems: {
				include: {
					service: true,
					equipmentUsages: {
						include: {
							equipment: { select: { id: true, name: true } },
						},
					},
					sampleTracking: {
						include: {
							analysisResults: {
								select: {
									id: true,
									fileName: true,
									filePath: true,
									fileSize: true,
									fileType: true,
									description: true,
									uploadedAt: true,
								},
							},
						},
					},
					serviceAddOns: true,
				},
			},
			workspaceBookings: {
				include: {
					equipmentUsages: {
						include: {
							equipment: { select: { id: true, name: true } },
						},
					},
					serviceAddOns: true,
				},
			},
			serviceForms: true,
		},
	});

	if (!booking) {
		return null;
	}

	// Calculate financial info from document verification
	let hasUnverifiedPayments = false;

	// Check payment receipt document verification status
	const paymentReceiptVerifiedDoc = booking.bookingDocuments.find(
		(doc) =>
			doc.type === "payment_receipt" && doc.verificationStatus === "verified",
	);
	const pendingPaymentDoc = booking.bookingDocuments.find(
		(doc) =>
			doc.type === "payment_receipt" &&
			doc.verificationStatus === "pending_verification",
	);

	// If payment receipt is verified via document verification, consider paid
	const isPaidViaDocVerification = Boolean(paymentReceiptVerifiedDoc);

	// If there are pending payment receipt documents, flag for verification
	if (pendingPaymentDoc) {
		hasUnverifiedPayments = true;
	}

	// Calculate sample counts
	let totalSamples = 0;
	let samplesCompleted = 0;
	for (const item of booking.serviceItems) {
		totalSamples += item.sampleTracking.length;
		samplesCompleted += item.sampleTracking.filter(
			(s) => s.status === "analysis_complete" || s.status === "returned",
		).length;
	}

	// Check if booking has workspace service
	const hasWorkspaceService = booking.workspaceBookings.length > 0;

	// Calculate if paid - document verification only
	const isPaid = isPaidViaDocVerification;

	// Result Gatekeeper: Check document verification status
	// Results can only be downloaded if all required documents are verified
	const allDocsVerified = checkDocumentVerificationForDownload(
		booking.bookingDocuments,
		hasWorkspaceService,
	);
	const canDownloadResults = allDocsVerified && samplesCompleted > 0;

	// Fetch pending modifications for all service items in this booking
	const serviceItemIds = booking.serviceItems.map((item) => item.id);
	const modifications = await db.sampleModification.findMany({
		where: {
			bookingServiceItemId: { in: serviceItemIds },
		},
		include: {
			bookingServiceItem: {
				include: {
					service: { select: { name: true } },
				},
			},
			createdByUser: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					userType: true,
				},
			},
			approvedByUser: {
				select: {
					firstName: true,
					lastName: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	// Map modifications to VM - determine if initiated by admin
	const pendingModifications: UserModificationVM[] = modifications.map((m) => ({
		id: m.id,
		bookingServiceItemId: m.bookingServiceItemId,
		serviceName: m.bookingServiceItem.service.name,
		originalQuantity: m.originalQuantity,
		newQuantity: m.newQuantity,
		originalTotalPrice: decimalToString(m.originalTotalPrice),
		newTotalPrice: decimalToString(m.newTotalPrice),
		reason: m.reason,
		status: m.status,
		initiatedByAdmin: m.createdByUser.userType === "lab_administrator",
		createdBy: {
			firstName: m.createdByUser.firstName ?? "Unknown",
			lastName: m.createdByUser.lastName ?? "",
		},
		createdAt: m.createdAt.toISOString(),
		approvedAt: m.approvedAt?.toISOString() ?? null,
		approvedBy: m.approvedByUser
			? {
					firstName: m.approvedByUser.firstName ?? "Unknown",
					lastName: m.approvedByUser.lastName ?? "",
				}
			: null,
	}));

	return {
		id: booking.id,
		referenceNumber: booking.referenceNumber,
		status: booking.status,
		projectDescription: booking.projectDescription,
		notes: booking.notes,
		preferredStartDate: dateToISOString(booking.preferredStartDate),
		preferredEndDate: dateToISOString(booking.preferredEndDate),
		totalAmount: decimalToString(booking.totalAmount),
		createdAt: booking.createdAt.toISOString(),
		updatedAt: booking.updatedAt.toISOString(),
		reviewedAt: dateToISOString(booking.reviewedAt),
		reviewNotes: booking.reviewNotes,

		serviceItems: booking.serviceItems.map((item) => ({
			id: item.id,
			service: {
				id: item.service.id,
				code: item.service.code,
				name: item.service.name,
				category: item.service.category,
				requiresSample: item.service.requiresSample,
			},
			quantity: item.quantity,
			unitPrice: decimalToString(item.unitPrice),
			totalPrice: decimalToString(item.totalPrice),
			sampleName: item.sampleName,
			sampleDetails: item.sampleDetails,
			sampleType: item.sampleType,
			sampleHazard: item.sampleHazard,
			testingMethod: item.testingMethod,
			degasConditions: item.degasConditions,
			solventSystem: item.solventSystem,
			solvents: item.solvents,
			solventComposition: item.solventComposition,
			columnType: item.columnType,
			flowRate: decimalToString(item.flowRate),
			wavelength: item.wavelength,
			expectedRetentionTime: decimalToString(item.expectedRetentionTime),
			samplePreparation: item.samplePreparation,
			notes: item.notes,
			expectedCompletionDate: dateToISOString(item.expectedCompletionDate),
			actualCompletionDate: dateToISOString(item.actualCompletionDate),
			turnaroundEstimate: item.turnaroundEstimate,
			hplcPreparationRequired: item.hplcPreparationRequired,
			temperatureControlled: item.temperatureControlled,
			lightSensitive: item.lightSensitive,
			hazardousMaterial: item.hazardousMaterial,
			inertAtmosphere: item.inertAtmosphere,
			equipmentUsages: item.equipmentUsages.map((eu) => ({
				equipment: { id: eu.equipment.id, name: eu.equipment.name },
			})),
			sampleTracking: item.sampleTracking.map((st) => ({
				id: st.id,
				sampleIdentifier: st.sampleIdentifier,
				status: st.status,
				receivedAt: dateToISOString(st.receivedAt),
				analysisStartAt: dateToISOString(st.analysisStartAt),
				analysisCompleteAt: dateToISOString(st.analysisCompleteAt),
				returnRequestedAt: dateToISOString(st.returnRequestedAt),
				returnedAt: dateToISOString(st.returnedAt),
				notes: st.notes,
				createdAt: st.createdAt.toISOString(),
				updatedAt: st.updatedAt.toISOString(),
				analysisResults: st.analysisResults.map((ar) => ({
					id: ar.id,
					fileName: ar.fileName,
					filePath: ar.filePath,
					fileSize: ar.fileSize,
					fileType: ar.fileType,
					description: ar.description,
					uploadedAt: ar.uploadedAt.toISOString(),
				})),
			})),
			serviceAddOns: item.serviceAddOns.map((addon) => ({
				id: addon.id,
				name: addon.name,
				amount: decimalToString(addon.amount),
				description: addon.description,
			})),
		})),

		workspaceBookings: booking.workspaceBookings.map((ws) => ({
			id: ws.id,
			startDate: ws.startDate.toISOString(),
			endDate: ws.endDate.toISOString(),
			preferredTimeSlot: ws.preferredTimeSlot,
			purpose: ws.purpose,
			notes: ws.notes,
			equipmentUsages: ws.equipmentUsages.map((eu) => ({
				equipment: { id: eu.equipment.id, name: eu.equipment.name },
			})),
			serviceAddOns: ws.serviceAddOns.map((addon) => ({
				id: addon.id,
				name: addon.name,
				amount: decimalToString(addon.amount),
				description: addon.description,
			})),
		})),

		serviceForms: booking.serviceForms.map((form) => ({
			id: form.id,
			formNumber: form.formNumber,
			totalAmount: decimalToString(form.totalAmount),
			status: form.status,
			validUntil: form.validUntil.toISOString(),
			serviceFormUnsignedPdfPath: form.serviceFormUnsignedPdfPath,
			workingAreaAgreementUnsignedPdfPath:
				form.workingAreaAgreementUnsignedPdfPath,
			requiresWorkingAreaAgreement: form.requiresWorkingAreaAgreement,
			generatedAt: form.generatedAt.toISOString(),
		})),

		pendingModifications,
		paidAmount: isPaidViaDocVerification
			? decimalToString(booking.totalAmount)
			: "0.00",
		isPaid,
		hasUnverifiedPayments,
		totalSamples,
		samplesCompleted,
		canDownloadResults,
		// Extract verifiedAt from the payment receipt document if verified
		paymentVerifiedAt: paymentReceiptVerifiedDoc?.verifiedAt
			? dateToISOString(paymentReceiptVerifiedDoc.verifiedAt)
			: null,
	};
}
