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

export interface LabEquipment {
	id: string;
	name: string;
	description?: string;
	isAvailable: boolean;
	maintenanceNotes?: string;
	expectedMaintenanceEnd?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface BookingServiceItem {
	id: string;
	serviceId: string;
	service?: Service;
	quantity: number;
	durationMonths: number;
	unitPrice: number;
	totalPrice: number;
	sampleName?: string;
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
	// Timelines
	expectedCompletionDate?: Date;
	actualCompletionDate?: Date;
	turnaroundEstimate?: string;
	// Special handling requirements
	temperatureControlled: boolean;
	lightSensitive: boolean;
	hazardousMaterial: boolean;
	inertAtmosphere: boolean;
	// Unified equipment system
	equipmentUsages?: Array<{ equipment: LabEquipment }>;
	otherEquipmentRequests?: string[]; // Array of custom equipment names
}

export interface WorkspaceBooking {
	id: string;
	bookingRequestId: string;
	startDate: Date;
	endDate: Date;
	preferredTimeSlot?: string;
	equipmentUsages?: Array<{ equipment: LabEquipment }>;
	specialEquipment?: string[]; // Array of custom equipment names
	purpose?: string;
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
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
	workspaceBookings?: WorkspaceBooking[];
	additionalNotes?: string;
}

export interface BookingFormData {
	projectDescription?: string;
	preferredStartDate?: Date;
	preferredEndDate?: Date;
	serviceItems: Omit<
		BookingServiceItem,
		"id" | "serviceId" | "equipmentUsages"
	>[];
	workspaceBookings?: Omit<
		WorkspaceBooking,
		"id" | "bookingRequestId" | "equipmentUsages"
	>[];
	additionalNotes?: string;
}

export interface BookingStep {
	number: number;
	title: string;
	status: "completed" | "current" | "upcoming";
}
