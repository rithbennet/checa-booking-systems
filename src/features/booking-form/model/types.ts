/**
 * Booking Form feature types
 */

import type { BookingServiceItem, BookingStep } from "@/entities/booking";
import type { Service } from "@/entities/service";

export interface BookingFormState {
	currentStep: number;
	steps: BookingStep[];
	selectedServices: BookingServiceItem[];
	projectDescription?: string;
	preferredStartDate?: Date;
	preferredEndDate?: Date;
	additionalNotes?: string;
	isSubmitting: boolean;
	errors: Record<string, string>;
}

export interface ServiceDetailsFormData {
	sampleType?: string;
	quantity?: number;
	durationMonths?: number;
	sampleDetails?: string;
	sampleHazard?: string;
	testingMethod?: string;
	hplcPreparationRequired?: boolean;
	temperatureControlled?: boolean;
	lightSensitive?: boolean;
	hazardousMaterial?: boolean;
	inertAtmosphere?: boolean;
	technicalRequirements?: string;
	startDate?: Date;
	endDate?: Date;
	preferredTimeSlot?: string;
	deadlineRequirements?: string;
	fumeHood?: boolean;
	analyticalBalance?: boolean;
	heatingEquipment?: boolean;
	magneticStirrer?: boolean;
	rotaryEvaporator?: boolean;
	vacuumSystem?: boolean;
	otherEquipmentRequirements?: string;
}

