/**
 * User Results Repository
 * Data access layer for user-facing sample results with payment gate
 */

import type { payment_status_enum, sample_status_enum } from "generated/prisma";
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
 * Check if a booking has verified payment
 * A booking is considered paid if any payment has status 'verified'
 */
function checkBookingPaymentStatus(
	serviceForms: Array<{
		invoices: Array<{
			payments: Array<{ status: payment_status_enum }>;
		}>;
	}>,
): boolean {
	for (const form of serviceForms) {
		for (const invoice of form.invoices) {
			for (const payment of invoice.payments) {
				if (payment.status === "verified") {
					return true;
				}
			}
		}
	}
	return false;
}

// ==============================================================
// Query Functions
// ==============================================================

/**
 * Get all sample tracking records for a user with payment status
 * Sorted by updatedAt descending (most recent activity first)
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
							serviceForms: {
								include: {
									invoices: {
										include: {
											payments: {
												select: {
													status: true,
												},
											},
										},
									},
								},
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
		const isPaid = checkBookingPaymentStatus(booking.serviceForms);

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
 * Get a single analysis result with payment verification
 * Returns null if not found or user doesn't own the booking
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
									serviceForms: {
										include: {
											invoices: {
												include: {
													payments: {
														select: { status: true },
													},
												},
											},
										},
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

	const isPaid = checkBookingPaymentStatus(booking.serviceForms);

	return {
		result: {
			id: analysisResult.id,
			fileName: analysisResult.fileName,
			filePath: analysisResult.filePath,
			fileType: analysisResult.fileType,
		},
		isPaid,
	};
}
