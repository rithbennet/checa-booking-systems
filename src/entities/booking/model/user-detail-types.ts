/**
 * User Booking Detail Types
 *
 * Types for the user booking detail view.
 * Similar to command-center-types but without admin-specific data.
 */

import type {
	booking_status_enum,
	invoice_status_enum,
	payment_status_enum,
	sample_status_enum,
	service_category_enum,
} from "generated/prisma";

// ============================================
// Sample Types (same as command center)
// ============================================

export interface UserSampleTrackingVM {
	id: string;
	sampleIdentifier: string;
	status: sample_status_enum;
	receivedAt: string | null;
	analysisStartAt: string | null;
	analysisCompleteAt: string | null;
	returnRequestedAt: string | null;
	returnedAt: string | null;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
	analysisResults: UserAnalysisResultVM[];
}

export interface UserAnalysisResultVM {
	id: string;
	fileName: string;
	filePath: string;
	fileSize: number;
	fileType: string;
	description: string | null;
	uploadedAt: string;
}

// ============================================
// Service Item Types
// ============================================

export interface UserServiceItemVM {
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
	sampleTracking: UserSampleTrackingVM[];
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

export interface UserWorkspaceBookingVM {
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

export interface UserServiceFormVM {
	id: string;
	formNumber: string;
	totalAmount: string;
	status: "generated" | "downloaded" | "signed_forms_uploaded" | "expired";
	validUntil: string;
	serviceFormUnsignedPdfPath: string | null;
	workingAreaAgreementUnsignedPdfPath: string | null;
	requiresWorkingAreaAgreement: boolean;
	generatedAt: string;
	invoices: UserInvoiceVM[];
}

export interface UserInvoiceVM {
	id: string;
	invoiceNumber: string;
	invoiceDate: string;
	dueDate: string;
	amount: string;
	status: invoice_status_enum;
	filePath: string | null;
	payments: UserPaymentVM[];
}

export interface UserPaymentVM {
	id: string;
	amount: string;
	paymentMethod: "eft" | "vote_transfer" | "local_order";
	paymentDate: string;
	referenceNumber: string | null;
	status: payment_status_enum;
	verifiedAt: string | null;
}

// ============================================
// Modification Request Types
// ============================================

export type ModificationStatus = "pending" | "approved" | "rejected";

export interface UserModificationVM {
	id: string;
	bookingServiceItemId: string;
	serviceName: string;
	originalQuantity: number;
	newQuantity: number;
	originalTotalPrice: string;
	newTotalPrice: string;
	reason: string;
	status: ModificationStatus;
	initiatedByAdmin: boolean;
	createdBy: { firstName: string; lastName: string };
	createdAt: string;
	approvedAt: string | null;
	approvedBy: { firstName: string; lastName: string } | null;
}

// ============================================
// Main User Booking Detail ViewModel
// ============================================

export interface UserBookingDetailVM {
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

	// Service items
	serviceItems: UserServiceItemVM[];

	// Workspace bookings
	workspaceBookings: UserWorkspaceBookingVM[];

	// Service forms (with invoices and payments)
	serviceForms: UserServiceFormVM[];

	// Pending modification requests
	pendingModifications: UserModificationVM[];

	// Computed fields
	paidAmount: string;
	isPaid: boolean;
	hasUnverifiedPayments: boolean;
	totalSamples: number;
	samplesCompleted: number;
	canDownloadResults: boolean;
}

// ============================================
// Status Timeline Types (for user view)
// ============================================

export type UserTimelineStep =
	| "submitted"
	| "approved"
	| "samples_received"
	| "in_progress"
	| "paid"
	| "released";

export interface UserTimelineStepConfig {
	key: UserTimelineStep;
	label: string;
	description: string;
	isCompleted: boolean;
	isCurrent: boolean;
	date?: string;
}

/**
 * Generate timeline steps for user booking detail view
 * Similar flow to admin: Submitted → Approved → Samples In → Processing → Paid → Released
 */
export function getUserTimelineSteps(
	booking: UserBookingDetailVM,
): UserTimelineStepConfig[] {
	// Define step order (matching admin flow)
	const steps: UserTimelineStep[] = [
		"submitted",
		"approved",
		"samples_received",
		"in_progress",
		"paid",
		"released",
	];

	// Compute actual completion states based on data
	const hasSamplesReceived = booking.serviceItems.some((item) =>
		item.sampleTracking.some(
			(s) => s.status !== "pending" && s.receivedAt !== null,
		),
	);

	const hasAnalysisStarted = booking.serviceItems.some((item) =>
		item.sampleTracking.some((s) => s.analysisStartAt !== null),
	);

	const allAnalysisComplete =
		booking.totalSamples > 0 &&
		booking.samplesCompleted === booking.totalSamples;

	const isPaid = booking.isPaid;
	const isReleased = booking.status === "completed";

	// Determine which steps are completed and which is current
	const stepStates: Record<
		UserTimelineStep,
		{ isCompleted: boolean; isCurrent: boolean }
	> = {
		submitted: {
			isCompleted:
				booking.status !== "draft" &&
				booking.status !== "pending_user_verification" &&
				booking.status !== "pending_approval" &&
				booking.status !== "revision_requested",
			isCurrent:
				booking.status === "pending_approval" ||
				booking.status === "pending_user_verification" ||
				booking.status === "revision_requested",
		},
		approved: {
			isCompleted:
				booking.status === "in_progress" ||
				booking.status === "completed" ||
				hasSamplesReceived,
			isCurrent: booking.status === "approved" && !hasSamplesReceived,
		},
		samples_received: {
			isCompleted:
				hasSamplesReceived && (hasAnalysisStarted || allAnalysisComplete),
			isCurrent:
				hasSamplesReceived && !hasAnalysisStarted && !allAnalysisComplete,
		},
		in_progress: {
			isCompleted: allAnalysisComplete,
			isCurrent: hasAnalysisStarted && !allAnalysisComplete,
		},
		paid: {
			isCompleted: isPaid,
			isCurrent: allAnalysisComplete && !isPaid,
		},
		released: {
			isCompleted: isReleased,
			isCurrent: isPaid && !isReleased,
		},
	};

	// Handle edge cases - adjust current step based on status
	if (booking.status === "in_progress") {
		// If status is in_progress but no samples started analysis yet, show as current
		if (!hasAnalysisStarted) {
			stepStates.in_progress.isCurrent = true;
			stepStates.samples_received.isCompleted = hasSamplesReceived;
			stepStates.samples_received.isCurrent = !hasSamplesReceived;
		}
	}

	const stepConfig: Record<
		UserTimelineStep,
		{ label: string; description: string }
	> = {
		submitted: {
			label: "Submitted",
			description: "Booking request submitted for review",
		},
		approved: {
			label: "Approved",
			description: "Booking approved, ready for samples",
		},
		samples_received: {
			label: "Samples In",
			description: "Lab has received your samples",
		},
		in_progress: {
			label: "Processing",
			description: "Analysis is being performed",
		},
		paid: {
			label: "Payment",
			description: "Payment verified",
		},
		released: {
			label: "Released",
			description: "Results available for download",
		},
	};

	return steps.map((step) => ({
		key: step,
		...stepConfig[step],
		isCompleted: stepStates[step].isCompleted,
		isCurrent: stepStates[step].isCurrent,
		date: getStepDate(booking, step),
	}));
}

function getStepDate(
	booking: UserBookingDetailVM,
	step: UserTimelineStep,
): string | undefined {
	switch (step) {
		case "submitted":
			return booking.createdAt;
		case "approved":
			return booking.reviewedAt ?? undefined;
		case "samples_received": {
			const receivedDates = booking.serviceItems
				.flatMap((item) => item.sampleTracking)
				.map((s) => s.receivedAt)
				.filter((d): d is string => d !== null);
			return receivedDates.sort()[0];
		}
		case "in_progress": {
			const analysisStartDates = booking.serviceItems
				.flatMap((item) => item.sampleTracking)
				.map((s) => s.analysisStartAt)
				.filter((d): d is string => d !== null);
			return analysisStartDates.sort()[0];
		}
		case "paid": {
			// Find the first verified payment date
			for (const form of booking.serviceForms) {
				for (const invoice of form.invoices) {
					for (const payment of invoice.payments) {
						if (payment.status === "verified" && payment.verifiedAt) {
							return payment.verifiedAt;
						}
					}
				}
			}
			return undefined;
		}
		case "released":
			return booking.status === "completed" ? booking.updatedAt : undefined;
		default:
			return undefined;
	}
}
