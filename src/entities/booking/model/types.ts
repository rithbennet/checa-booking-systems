/**
 * Booking entity types
 *
 * This file contains type definitions for the Booking entity.
 * Entities represent core business concepts.
 */

import type { Service } from "@/entities/service";

export type BookingStatus =
	| "pending_user_verification"
	| "pending_approval"
	| "approved"
	| "rejected"
	| "in_progress"
	| "completed"
	| "cancelled";

export type SampleType = "liquid" | "solid" | "powder" | "solution";

export type PaymentMethod = "eft" | "vote_transfer" | "local_order";

export interface BookingServiceItem {
	id: string;
	serviceId: string;
	service?: Service;
	quantity: number;
	durationMonths: number;
	unitPrice: number;
	totalPrice: number;
	sampleDetails?: string;
	sampleType?: SampleType;
	sampleHazard?: string;
	testingMethod?: string;
	degasConditions?: string;
	solventSystem?: string;
	solvents?: string;
	solventComposition?: string;
	columnType?: string;
	flowRate?: number;
	wavelength?: number;
	expectedRetentionTime?: number;
	samplePreparation?: string;
	notes?: string;
	// Special handling requirements
	temperatureControlled?: boolean;
	lightSensitive?: boolean;
	hazardousMaterial?: boolean;
	inertAtmosphere?: boolean;
	// HPLC preparation
	hplcPreparationRequired?: boolean;
	// Working space specific
	startDate?: Date;
	endDate?: Date;
	preferredTimeSlot?: string;
	deadlineRequirements?: string;
	// Equipment needs
	fumeHood?: boolean;
	analyticalBalance?: boolean;
	heatingEquipment?: boolean;
	magneticStirrer?: boolean;
	rotaryEvaporator?: boolean;
	vacuumSystem?: boolean;
	otherEquipmentRequirements?: string;
}

export interface BookingRequest {
	id: string;
	userId: string;
	referenceNumber: string;
	projectDescription?: string;
	preferredStartDate?: Date;
	preferredEndDate?: Date;
	totalAmount: number;
	status: BookingStatus;
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
	reviewedAt?: Date;
	reviewedBy?: string;
	reviewNotes?: string;
	serviceItems: BookingServiceItem[];
	additionalNotes?: string;
}

export interface BookingFormData {
	projectDescription?: string;
	preferredStartDate?: Date;
	preferredEndDate?: Date;
	serviceItems: Omit<BookingServiceItem, "id" | "serviceId">[];
	additionalNotes?: string;
}

export interface BookingStep {
	number: number;
	title: string;
	status: "completed" | "current" | "upcoming";
}

