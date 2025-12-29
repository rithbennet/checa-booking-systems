/**
 * Booking Form feature types
 */

import type { BookingServiceItem, BookingStep } from "@/entities/booking";

export type InstitutionalAcademicType = "student" | "staff" | "none";

export interface BookingProfile {
	firstName: string;
	lastName: string;
	email: string;
	phone: string | null;
	userType: "mjiit_member" | "utm_member" | "external_member";
	academicType: InstitutionalAcademicType | null;
	userIdentifier: string | null;
	supervisorName: string | null;
	organization?: {
		facultyId?: string | null;
		departmentId?: string | null;
		ikohzaId?: string | null;
		companyId?: string | null;
		companyBranchId?: string | null;
	};
}

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
	sampleDetails?: string;
	sampleHazard?: string;
	testingMethod?: string;
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
