/**
 * Booking mappers - Convert between DB models and form inputs
 */

import type { CreateBookingInput } from "../model/schemas";

/**
 * Map a complete database BookingRequest to CreateBookingInput form structure
 */
export function mapBookingToCreateBookingInput(booking: {
	projectDescription?: string | null;
	preferredStartDate?: Date | null;
	preferredEndDate?: Date | null;
	status: string;
	notes?: string | null;
	serviceItems?: Array<{
		serviceId: string;
		quantity: number;
		durationMonths: number;
		sampleName?: string | null;
		sampleDetails?: string | null;
		sampleType?: string | null;
		sampleHazard?: string | null;
		testingMethod?: string | null;
		degasConditions?: string | null;
		solventSystem?: string | null;
		solvents?: string | null;
		solventComposition?: string | null;
		columnType?: string | null;
		flowRate?: number | null;
		wavelength?: number | null;
		expectedRetentionTime?: number | null;
		samplePreparation?: string | null;
		notes?: string | null;
		expectedCompletionDate?: Date | null;
		actualCompletionDate?: Date | null;
		turnaroundEstimate?: string | null;
		temperatureControlled?: boolean;
		lightSensitive?: boolean;
		hazardousMaterial?: boolean;
		inertAtmosphere?: boolean;
		equipmentUsages?: Array<{ equipment: { id: string } }>;
		otherEquipmentRequests?: unknown;
	}>;
	workspaceBookings?: Array<{
		startDate: Date;
		endDate: Date;
		preferredTimeSlot?: string | null;
		equipmentUsages?: Array<{ equipment: { id: string } }>;
		specialEquipment?: unknown;
		purpose?: string | null;
		notes?: string | null;
	}>;
}): CreateBookingInput {
	return {
		projectDescription: booking.projectDescription ?? undefined,
		preferredStartDate: booking.preferredStartDate ?? undefined,
		preferredEndDate: booking.preferredEndDate ?? undefined,
		status: booking.status as "draft", // Explicitly cast for edit mode
		notes: booking.notes ?? undefined,
		serviceItems:
			booking.serviceItems?.map((item) => ({
				serviceId: item.serviceId,
				quantity: item.quantity,
				durationMonths: item.durationMonths,
				sampleName: item.sampleName ?? undefined,
				sampleDetails: item.sampleDetails ?? undefined,
				sampleType:
					(item.sampleType as "liquid" | "solid" | "powder" | "solution") ??
					undefined,
				sampleHazard: item.sampleHazard ?? undefined,
				testingMethod: item.testingMethod ?? undefined,
				degasConditions: item.degasConditions ?? undefined,
				solventSystem: item.solventSystem ?? undefined,
				solvents: item.solvents ?? undefined,
				solventComposition: item.solventComposition ?? undefined,
				columnType: item.columnType ?? undefined,
				flowRate: item.flowRate ?? undefined,
				wavelength: item.wavelength ?? undefined,
				expectedRetentionTime: item.expectedRetentionTime ?? undefined,
				samplePreparation: item.samplePreparation ?? undefined,
				notes: item.notes ?? undefined,
				expectedCompletionDate: item.expectedCompletionDate ?? undefined,
				actualCompletionDate: item.actualCompletionDate ?? undefined,
				turnaroundEstimate: item.turnaroundEstimate ?? undefined,
				temperatureControlled: item.temperatureControlled ?? false,
				lightSensitive: item.lightSensitive ?? false,
				hazardousMaterial: item.hazardousMaterial ?? false,
				inertAtmosphere: item.inertAtmosphere ?? false,
				equipmentIds:
					item.equipmentUsages?.map((usage) => usage.equipment.id) ?? [],
				otherEquipmentRequests: Array.isArray(item.otherEquipmentRequests)
					? item.otherEquipmentRequests
					: undefined,
			})) ?? [],
		workspaceBookings:
			booking.workspaceBookings?.map((workspace) => ({
				startDate: workspace.startDate,
				endDate: workspace.endDate,
				preferredTimeSlot: workspace.preferredTimeSlot ?? undefined,
				equipmentIds:
					workspace.equipmentUsages?.map((usage) => usage.equipment.id) ?? [],
				specialEquipment: Array.isArray(workspace.specialEquipment)
					? workspace.specialEquipment
					: undefined,
				purpose: workspace.purpose ?? undefined,
				notes: workspace.notes ?? undefined,
			})) ?? [],
		additionalNotes: undefined, // Not stored separately in DB yet
		// Billing fields - these should come from the user's profile in most cases
		// but we include them if they were saved
		payerType: undefined, // Derive from user profile on load
		billingName: undefined,
		billingAddressDisplay: undefined,
		billingPhone: undefined,
		billingEmail: undefined,
		utmCampus: undefined,
	};
}
