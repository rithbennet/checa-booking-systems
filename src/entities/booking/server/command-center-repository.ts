/**
 * Booking Command Center Server Repository
 *
 * Fetches comprehensive booking data for the admin command center view.
 */

import type { Decimal } from "generated/prisma/runtime/library";
import { db } from "@/shared/server/db";
import type { BookingCommandCenterVM } from "../model/command-center-types";

function decimalToString(value: Decimal | null | undefined): string {
	return value?.toString() ?? "0";
}

function dateToISOString(date: Date | null | undefined): string | null {
	return date?.toISOString() ?? null;
}

export async function getBookingCommandCenterData(
	bookingId: string,
): Promise<BookingCommandCenterVM> {
	const booking = await db.bookingRequest.findUniqueOrThrow({
		where: { id: bookingId },
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
			company: { select: { name: true } },
			companyBranch: { select: { name: true } },
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
								include: {
									uploadedByUser: {
										select: { firstName: true, lastName: true },
									},
								},
							},
							updatedByUser: { select: { firstName: true, lastName: true } },
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
			// Include booking documents to check verification status
			bookingDocuments: {
				where: {
					type: "payment_receipt",
				},
				select: {
					id: true,
					type: true,
					verificationStatus: true,
				},
			},
		},
	});

	// Calculate financial info from document verification
	let hasUnverifiedPayments = false;

	// Check payment receipt document verification status
	const paymentReceiptDoc = booking.bookingDocuments.find(
		(doc) =>
			doc.type === "payment_receipt" && doc.verificationStatus === "verified",
	);
	const pendingPaymentDoc = booking.bookingDocuments.find(
		(doc) =>
			doc.type === "payment_receipt" &&
			doc.verificationStatus === "pending_verification",
	);

	// If payment receipt is verified via document verification, consider paid
	const isPaidViaDocVerification = Boolean(paymentReceiptDoc);

	// If there are pending payment receipt documents, flag for verification
	if (pendingPaymentDoc) {
		hasUnverifiedPayments = true;
	}

	// Calculate sample counts
	let totalSamples = 0;
	let samplesInAnalysis = 0;
	for (const item of booking.serviceItems) {
		totalSamples += item.sampleTracking.length;
		samplesInAnalysis += item.sampleTracking.filter(
			(s) => s.status === "in_analysis",
		).length;
	}

	// Determine organization name
	const isExternal = Boolean(booking.company || booking.user.company);
	const organizationName = isExternal
		? (booking.company?.name ?? booking.user.company?.name ?? null)
		: (booking.user.ikohza?.name ??
			booking.user.faculty?.name ??
			booking.user.department?.name ??
			null);

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

		user: {
			id: booking.user.id,
			firstName: booking.user.firstName,
			lastName: booking.user.lastName,
			email: booking.user.email,
			phone: booking.user.phone,
			userType: booking.user.userType,
			ikohza: booking.user.ikohza,
			faculty: booking.user.faculty,
			department: booking.user.department,
			company: booking.user.company,
			companyBranch: booking.user.companyBranch,
		},

		company: booking.company,
		companyBranch: booking.companyBranch,

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
				updatedBy: st.updatedBy,
				updatedByUser: st.updatedByUser,
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
					uploadedBy: {
						firstName: ar.uploadedByUser.firstName,
						lastName: ar.uploadedByUser.lastName,
					},
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
			serviceFormSignedPdfPath: form.serviceFormSignedPdfPath,
			requiresWorkingAreaAgreement: form.requiresWorkingAreaAgreement,
			workingAreaAgreementUnsignedPdfPath:
				form.workingAreaAgreementUnsignedPdfPath,
			workingAreaAgreementSignedPdfPath: form.workingAreaAgreementSignedPdfPath,
			generatedAt: form.generatedAt.toISOString(),
			signedFormsUploadedAt: dateToISOString(form.signedFormsUploadedAt),
			signedFormsUploadedBy: form.signedFormsUploadedBy,
		})),

		isExternal,
		organizationName,
		paidAmount: "0.00",
		// isPaid is true if payment receipt document verified
		isPaid: isPaidViaDocVerification,
		hasUnverifiedPayments,
		totalSamples,
		samplesInAnalysis,
	};
}
