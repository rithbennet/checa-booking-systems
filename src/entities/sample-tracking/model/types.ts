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

/**
 * Analysis result for user results page
 */
export interface UserAnalysisResult {
	id: string;
	fileName: string;
	fileSize: number;
	fileType: string;
	description: string | null;
}

/**
 * User sample result row (user results page)
 * Each row represents a single physical sample with its payment/download status
 */
export interface UserSampleResultRow {
	id: string;
	sampleIdentifier: string;
	status: SampleStatus;
	serviceName: string;
	bookingId: string;
	bookingRef: string;
	isPaid: boolean;
	hasResults: boolean;
	resultCount: number;
	analysisResults: UserAnalysisResult[];
	createdAt: string;
	updatedAt: string;
}
