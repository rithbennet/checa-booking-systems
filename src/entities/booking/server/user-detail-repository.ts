/**
 * User Booking Detail Server Repository
 *
 * Fetches booking data for the user detail view.
 * Enforces ownership and excludes admin-only data.
 */

import type { Decimal } from "generated/prisma/runtime/library";
import { db } from "@/shared/server/db";
import type { UserBookingDetailVM } from "../model/user-detail-types";

function decimalToString(value: Decimal | null | undefined): string {
	return value?.toString() ?? "0";
}

function dateToISOString(date: Date | null | undefined): string | null {
	return date?.toISOString() ?? null;
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
			serviceForms: {
				include: {
					invoices: {
						include: {
							payments: true,
						},
					},
				},
			},
		},
	});

	if (!booking) {
		return null;
	}

	// Calculate financial info
	let totalPaid = 0;
	let hasUnverifiedPayments = false;

	for (const form of booking.serviceForms) {
		for (const invoice of form.invoices) {
			for (const payment of invoice.payments) {
				if (payment.status === "verified") {
					totalPaid += Number(payment.amount);
				} else if (payment.status === "pending") {
					hasUnverifiedPayments = true;
				}
			}
		}
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

	// Check if user can download results (payment verified)
	const isPaid = totalPaid >= Number(booking.totalAmount);
	const canDownloadResults = isPaid && samplesCompleted > 0;

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
			requiresWorkingAreaAgreement: form.requiresWorkingAreaAgreement,
			generatedAt: form.generatedAt.toISOString(),
			invoices: form.invoices.map((inv) => ({
				id: inv.id,
				invoiceNumber: inv.invoiceNumber,
				invoiceDate: inv.invoiceDate.toISOString(),
				dueDate: inv.dueDate.toISOString(),
				amount: decimalToString(inv.amount),
				status: inv.status,
				payments: inv.payments.map((pay) => ({
					id: pay.id,
					amount: decimalToString(pay.amount),
					paymentMethod: pay.paymentMethod,
					paymentDate: pay.paymentDate.toISOString(),
					referenceNumber: pay.referenceNumber,
					status: pay.status,
					verifiedAt: dateToISOString(pay.verifiedAt),
				})),
			})),
		})),

		paidAmount: totalPaid.toFixed(2),
		isPaid,
		hasUnverifiedPayments,
		totalSamples,
		samplesCompleted,
		canDownloadResults,
	};
}
