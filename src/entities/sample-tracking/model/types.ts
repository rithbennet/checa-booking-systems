/**
 * Sample Tracking Entity Types
 * Aligned with Prisma sample_status_enum
 */

export type SampleStatus =
	| "pending"
	| "received"
	| "in_analysis"
	| "analysis_complete"
	| "return_requested"
	| "returned";

/**
 * Sample operations list row (admin view)
 */
export interface SampleOperationsRow {
	id: string;
	sampleIdentifier: string;
	customerName: string;
	userType: string;
	serviceName: string;
	status: SampleStatus;
	bookingId: string;
	createdAt: Date | string;
}

/**
 * User active sample (dashboard widget)
 */
export interface UserActiveSample {
	id: string;
	sampleIdentifier: string;
	serviceName: string;
	status: SampleStatus;
	bookingId: string;
	createdAt: Date | string;
}
