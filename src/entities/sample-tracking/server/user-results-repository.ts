/**
 * User Results Repository
 * Data access layer for user-facing sample results with payment gate
 */

import type {
	document_verification_status_enum,
	sample_status_enum,
} from "generated/prisma";
import { db } from "@/shared/server/db";

// ==============================================================
// Types
// ==============================================================

export interface UserSampleResultVM {
	id: string;
	sampleIdentifier: string;
	status: sample_status_enum;
	serviceName: string;
	bookingId: string;
	bookingRef: string;
	isPaid: boolean;
	hasResults: boolean;
	resultCount: number;
	analysisResults: Array<{
		id: string;
		fileName: string;
		fileSize: number;
		fileType: string;
		description: string | null;
	}>;
	createdAt: string;
	updatedAt: string;
}

export interface UserSampleResultsResponse {
	items: UserSampleResultVM[];
}

// ==============================================================
// Helper Functions
// ==============================================================

/**
 * Check if all required documents are verified for result download
 * Result Gatekeeper: All documents must be verified before results can be downloaded
 */
function checkDocumentVerificationStatus(
	documents: Array<{
		type: string;
		verificationStatus: document_verification_status_enum | null;
	}>,
	hasWorkspaceService: boolean,
): {
	allVerified: boolean;
	serviceFormVerified: boolean;
	workspaceFormVerified: boolean;
	paymentReceiptVerified: boolean;
} {
	let serviceFormVerified = false;
	let workspaceFormVerified = false;
	let paymentReceiptVerified = false;

	for (const doc of documents) {
		if (doc.verificationStatus === "verified") {
			if (doc.type === "service_form_signed") {
				serviceFormVerified = true;
			} else if (doc.type === "workspace_form_signed") {
				workspaceFormVerified = true;
			} else if (doc.type === "payment_receipt") {
				paymentReceiptVerified = true;
			}
		}
	}

	// Workspace form is only required if booking has workspace service
	const workspaceFormOk = !hasWorkspaceService || workspaceFormVerified;

	return {
		allVerified:
			serviceFormVerified && workspaceFormOk && paymentReceiptVerified,
		serviceFormVerified,
		workspaceFormVerified,
		paymentReceiptVerified,
	};
}

// ==============================================================
// Query Functions
// ==============================================================

/**
 * Get all sample tracking records for a user with payment status
 * Sorted by updatedAt descending (most recent activity first)
 *
 * Result Gatekeeper: Uses document verification status to determine download eligibility
 */
export async function getUserSampleResults(
	userId: string,
): Promise<UserSampleResultsResponse> {
	// Fetch all SampleTracking records for bookings owned by this user
	const samples = await db.sampleTracking.findMany({
		where: {
			bookingServiceItem: {
				bookingRequest: {
					userId,
					// Only show samples from approved, in_progress, or completed bookings
					status: {
						in: ["approved", "in_progress", "completed"],
					},
				},
			},
		},
		include: {
			bookingServiceItem: {
				include: {
					service: {
						select: {
							name: true,
						},
					},
					bookingRequest: {
						select: {
							id: true,
							referenceNumber: true,
							// Include documents for verification check
							bookingDocuments: {
								select: {
									type: true,
									verificationStatus: true,
								},
							},
							// Include workspace bookings to check if workspace form is required
							workspaceBookings: {
								select: { id: true },
							},
						},
					},
				},
			},
			analysisResults: {
				select: {
					id: true,
					fileName: true,
					fileSize: true,
					fileType: true,
					description: true,
				},
			},
		},
		orderBy: {
			updatedAt: "desc",
		},
	});

	// Map to VMs
	const items: UserSampleResultVM[] = samples.map((sample) => {
		const booking = sample.bookingServiceItem.bookingRequest;

		// Check if booking has workspace service
		const hasWorkspaceService = booking.workspaceBookings.length > 0;

		// Result Gatekeeper: Check document verification status
		const verificationStatus = checkDocumentVerificationStatus(
			booking.bookingDocuments,
			hasWorkspaceService,
		);

		// Results are unlocked when all required documents are verified
		const isPaid = verificationStatus.allVerified;

		return {
			id: sample.id,
			sampleIdentifier: sample.sampleIdentifier,
			status: sample.status,
			serviceName: sample.bookingServiceItem.service.name,
			bookingId: booking.id,
			bookingRef: booking.referenceNumber,
			isPaid,
			hasResults: sample.analysisResults.length > 0,
			resultCount: sample.analysisResults.length,
			analysisResults: sample.analysisResults.map((ar) => ({
				id: ar.id,
				fileName: ar.fileName,
				fileSize: ar.fileSize,
				fileType: ar.fileType,
				description: ar.description,
			})),
			createdAt: sample.createdAt.toISOString(),
			updatedAt: sample.updatedAt.toISOString(),
		};
	});

	return { items };
}

/**
 * Get a single analysis result with document verification check
 * Returns null if not found or user doesn't own the booking
 *
 * Result Gatekeeper Logic:
 * - All required documents must be verified before results can be downloaded
 * - Required: service_form_signed, payment_receipt
 * - Required if workspace service: workspace_form_signed
 */
export async function getAnalysisResultWithPaymentCheck(
	resultId: string,
	userId: string,
): Promise<{
	result: {
		id: string;
		fileName: string;
		filePath: string;
		fileType: string;
	};
	isPaid: boolean;
	verificationDetails?: {
		serviceFormVerified: boolean;
		workspaceFormVerified: boolean;
		paymentReceiptVerified: boolean;
		requiresWorkspaceForm: boolean;
	};
} | null> {
	const analysisResult = await db.analysisResult.findUnique({
		where: { id: resultId },
		include: {
			sampleTracking: {
				include: {
					bookingServiceItem: {
						include: {
							bookingRequest: {
								select: {
									id: true,
									userId: true,
									// Include documents for verification check
									bookingDocuments: {
										select: {
											type: true,
											verificationStatus: true,
										},
									},
									// Include workspace bookings to check if workspace form is required
									workspaceBookings: {
										select: { id: true },
									},
								},
							},
						},
					},
				},
			},
		},
	});

	if (!analysisResult) {
		return null;
	}

	const booking =
		analysisResult.sampleTracking.bookingServiceItem.bookingRequest;

	// Verify ownership
	if (booking.userId !== userId) {
		return null;
	}

	// Check if booking has workspace service
	const hasWorkspaceService = booking.workspaceBookings.length > 0;

	// Result Gatekeeper: Check document verification status
	const verificationStatus = checkDocumentVerificationStatus(
		booking.bookingDocuments,
		hasWorkspaceService,
	);

	// Results are unlocked when all required documents are verified
	const isPaid = verificationStatus.allVerified;

	return {
		result: {
			id: analysisResult.id,
			fileName: analysisResult.fileName,
			filePath: analysisResult.filePath,
			fileType: analysisResult.fileType,
		},
		isPaid,
		verificationDetails: {
			serviceFormVerified: verificationStatus.serviceFormVerified,
			workspaceFormVerified: verificationStatus.workspaceFormVerified,
			paymentReceiptVerified: verificationStatus.paymentReceiptVerified,
			requiresWorkspaceForm: hasWorkspaceService,
		},
	};
}
