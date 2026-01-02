/**
 * Booking Command Center Types
 *
 * Extended types for the admin booking command center view
 * that combines all related entities.
 */

import type {
	booking_status_enum,
	sample_status_enum,
	service_category_enum,
} from "generated/prisma";

// ============================================
// Sample Types
// ============================================

export interface SampleTrackingVM {
	id: string;
	sampleIdentifier: string;
	status: sample_status_enum;
	receivedAt: string | null;
	analysisStartAt: string | null;
	analysisCompleteAt: string | null;
	returnRequestedAt: string | null;
	returnedAt: string | null;
	notes: string | null;
	updatedBy: string | null;
	updatedByUser: { firstName: string; lastName: string } | null;
	createdAt: string;
	updatedAt: string;
	analysisResults: AnalysisResultVM[];
}

export interface AnalysisResultVM {
	id: string;
	fileName: string;
	filePath: string;
	fileSize: number;
	fileType: string;
	description: string | null;
	uploadedAt: string;
	uploadedBy: { firstName: string; lastName: string };
}

// ============================================
// Service Item Types
// ============================================

export interface ServiceItemVM {
	id: string;
	service: {
		id: string;
		code: string;
		name: string;
		category: service_category_enum;
		requiresSample: boolean;
	};
	quantity: number;
	unitPrice: string;
	totalPrice: string;
	sampleName: string | null;
	sampleDetails: string | null;
	sampleType: string | null;
	sampleHazard: string | null;
	testingMethod: string | null;
	// Technical specs
	degasConditions: string | null;
	solventSystem: string | null;
	solvents: string | null;
	solventComposition: string | null;
	columnType: string | null;
	flowRate: string | null;
	wavelength: number | null;
	expectedRetentionTime: string | null;
	samplePreparation: string | null;
	notes: string | null;
	// Timeline
	expectedCompletionDate: string | null;
	actualCompletionDate: string | null;
	turnaroundEstimate: string | null;
	// Handling requirements
	hplcPreparationRequired: boolean;
	temperatureControlled: boolean;
	lightSensitive: boolean;
	hazardousMaterial: boolean;
	inertAtmosphere: boolean;
	// Equipment
	equipmentUsages: Array<{
		equipment: { id: string; name: string };
	}>;
	// Samples
	sampleTracking: SampleTrackingVM[];
	// Add-ons
	serviceAddOns: Array<{
		id: string;
		name: string;
		amount: string;
		description: string | null;
	}>;
}

// ============================================
// Workspace Types
// ============================================

export interface WorkspaceBookingVM {
	id: string;
	startDate: string;
	endDate: string;
	preferredTimeSlot: string | null;
	purpose: string | null;
	notes: string | null;
	equipmentUsages: Array<{
		equipment: { id: string; name: string };
	}>;
	serviceAddOns: Array<{
		id: string;
		name: string;
		amount: string;
		description: string | null;
	}>;
}

// ============================================
// Financial Types
// ============================================

export interface ServiceFormVM {
	id: string;
	formNumber: string;
	totalAmount: string;
	status: "generated" | "downloaded" | "signed_forms_uploaded" | "expired";
	validUntil: string;
	serviceFormUnsignedPdfPath: string;
	serviceFormSignedPdfPath: string | null;
	requiresWorkingAreaAgreement: boolean;
	workingAreaAgreementUnsignedPdfPath: string | null;
	workingAreaAgreementSignedPdfPath: string | null;
	generatedAt: string;
	signedFormsUploadedAt: string | null;
	signedFormsUploadedBy: string | null;
}

// ============================================
// User Types
// ============================================

export interface BookingUserVM {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string | null;
	userType:
		| "mjiit_member"
		| "utm_member"
		| "external_member"
		| "lab_administrator";
	// Organization info
	ikohza: { name: string } | null;
	faculty: { name: string } | null;
	department: { name: string } | null;
	company: { name: string } | null;
	companyBranch: { name: string } | null;
}

// ============================================
// Main Command Center ViewModel
// ============================================

export interface BookingCommandCenterVM {
	id: string;
	referenceNumber: string;
	status: booking_status_enum;
	projectDescription: string | null;
	notes: string | null;
	preferredStartDate: string | null;
	preferredEndDate: string | null;
	totalAmount: string;
	createdAt: string;
	updatedAt: string;
	reviewedAt: string | null;
	reviewNotes: string | null;
	releasedAt: string | null; // Set when booking transitions to completed

	// User info
	user: BookingUserVM;

	// Organization (for external)
	company: { name: string } | null;
	companyBranch: { name: string } | null;

	// Service items
	serviceItems: ServiceItemVM[];

	// Workspace bookings
	workspaceBookings: WorkspaceBookingVM[];

	// Service forms (with invoices and payments)
	serviceForms: ServiceFormVM[];

	// Computed fields
	isExternal: boolean;
	organizationName: string | null;
	paidAmount: string;
	isPaid: boolean;
	hasUnverifiedPayments: boolean;
	totalSamples: number;
	samplesInAnalysis: number;
}

// ============================================
// Status Timeline Types
// ============================================

export type TimelineStep =
	| "verified"
	| "samples_in"
	| "processing"
	| "payment"
	| "released";

export interface TimelineStepConfig {
	key: TimelineStep;
	label: string;
	icon: string;
	completedDate?: string;
	estimatedDate?: string;
}

// Helper to compute current timeline step from booking status
export function getTimelineStep(status: booking_status_enum): TimelineStep {
	switch (status) {
		case "draft":
		case "pending_user_verification":
			return "verified";
		case "pending_approval":
		case "revision_requested":
			return "verified";
		case "approved":
			return "samples_in";
		case "in_progress":
			return "processing";
		case "completed":
			return "released";
		case "rejected":
		case "cancelled":
			return "verified";
		default:
			return "verified";
	}
}

export function isTimelineStepCompleted(
	currentStep: TimelineStep,
	checkStep: TimelineStep,
): boolean {
	const order: TimelineStep[] = [
		"verified",
		"samples_in",
		"processing",
		"payment",
		"released",
	];
	const currentIndex = order.indexOf(currentStep);
	const checkIndex = order.indexOf(checkStep);
	return checkIndex < currentIndex;
}

export function isTimelineStepCurrent(
	currentStep: TimelineStep,
	checkStep: TimelineStep,
): boolean {
	return currentStep === checkStep;
}
