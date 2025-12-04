/**
 * Sample Tracking Repository
 * Data access layer for sample tracking operations
 */

import type { Prisma, sample_status_enum } from "generated/prisma";
import { db } from "@/shared/server/db";

/**
 * Find sample tracking records with full includes for operations list
 */
export async function findSampleTrackingList(params: {
	status?: string[];
	q?: string;
	userId?: string;
	exclude?: string[];
	page: number;
	pageSize: number;
}) {
	const { q, userId } = params;
	// Note: status, exclude, page, pageSize are handled in actions.ts after fetching all items

	// Query BookingServiceItem records for approved/in_progress/completed bookings
	const bookingServiceItemWhere: Prisma.BookingServiceItemWhereInput = {
		bookingRequest: {
			status: {
				in: ["approved", "in_progress", "completed"],
			},
			...(userId ? { userId } : {}),
		},
		service: {
			requiresSample: true,
		},
		...(q
			? {
					OR: [
						{
							sampleName: {
								contains: q,
								mode: "insensitive",
							},
						},
						{
							bookingRequest: {
								OR: [
									{
										user: {
											firstName: {
												contains: q,
												mode: "insensitive",
											},
										},
									},
									{
										user: {
											lastName: {
												contains: q,
												mode: "insensitive",
											},
										},
									},
								],
							},
						},
						{
							service: {
								name: {
									contains: q,
									mode: "insensitive",
								},
							},
						},
					],
				}
			: {}),
	};

	// Fetch all BookingServiceItems (without pagination) to ensure we can filter by status correctly
	const allServiceItems = await db.bookingServiceItem.findMany({
		where: bookingServiceItemWhere,
		include: {
			bookingRequest: {
				include: {
					user: {
						select: {
							firstName: true,
							lastName: true,
							userType: true,
						},
					},
				},
			},
			service: {
				select: {
					name: true,
				},
			},
			sampleTracking: true,
		},
		orderBy: {
			createdAt: "asc",
		},
	});

	return allServiceItems;
}

/**
 * Find or create SampleTracking record for a BookingServiceItem
 */
export async function findOrCreateSampleTracking(
	bookingServiceItemId: string,
	sampleName?: string | null,
) {
	// Check if SampleTracking already exists
	const existing = await db.sampleTracking.findFirst({
		where: { bookingServiceItemId },
		include: {
			bookingServiceItem: {
				include: {
					bookingRequest: {
						include: {
							user: {
								select: {
									firstName: true,
									lastName: true,
									userType: true,
								},
							},
						},
					},
					service: {
						select: {
							name: true,
						},
					},
				},
			},
		},
	});

	if (existing) {
		return existing;
	}

	// Create new SampleTracking record
	const sampleIdentifier =
		sampleName ||
		`SAMPLE-${bookingServiceItemId.substring(0, 8).toUpperCase()}`;

	return db.sampleTracking.create({
		data: {
			bookingServiceItemId,
			sampleIdentifier,
			status: "pending",
		},
		include: {
			bookingServiceItem: {
				include: {
					bookingRequest: {
						include: {
							user: {
								select: {
									firstName: true,
									lastName: true,
									userType: true,
								},
							},
						},
					},
					service: {
						select: {
							name: true,
						},
					},
				},
			},
		},
	});
}

/**
 * Update sample status
 */
export async function updateSampleStatus(
	sampleId: string,
	status: sample_status_enum,
	updatedBy: string,
) {
	const updateData: Prisma.SampleTrackingUpdateInput = {
		status,
		...(updatedBy ? { updatedBy } : {}),
	};

	// Set timestamp fields based on status
	const now = new Date();
	if (status === "received") {
		updateData.receivedAt = now;
	} else if (status === "in_analysis") {
		updateData.analysisStartAt = now;
	} else if (status === "analysis_complete") {
		updateData.analysisCompleteAt = now;
	} else if (status === "return_requested") {
		updateData.returnRequestedAt = now;
	} else if (status === "returned") {
		updateData.returnedAt = now;
	}

	return db.sampleTracking.update({
		where: { id: sampleId },
		data: updateData,
		include: {
			bookingServiceItem: {
				include: {
					bookingRequest: {
						include: {
							user: {
								select: {
									firstName: true,
									lastName: true,
									userType: true,
								},
							},
						},
					},
					service: {
						select: {
							name: true,
						},
					},
				},
			},
		},
	});
}

/**
 * Update sample status with full data needed for notifications
 * Returns userId and referenceNumber for sending notifications
 */
export async function updateSampleStatusWithNotificationData(
	sampleId: string,
	status: sample_status_enum,
	updatedBy: string,
) {
	const updateData: Prisma.SampleTrackingUpdateInput = {
		status,
		...(updatedBy ? { updatedBy } : {}),
	};

	// Set timestamp fields based on status
	const now = new Date();
	if (status === "received") {
		updateData.receivedAt = now;
	} else if (status === "in_analysis") {
		updateData.analysisStartAt = now;
	} else if (status === "analysis_complete") {
		updateData.analysisCompleteAt = now;
	} else if (status === "return_requested") {
		updateData.returnRequestedAt = now;
	} else if (status === "returned") {
		updateData.returnedAt = now;
	}

	return db.sampleTracking.update({
		where: { id: sampleId },
		data: updateData,
		include: {
			bookingServiceItem: {
				include: {
					bookingRequest: {
						include: {
							user: {
								select: {
									firstName: true,
									lastName: true,
									userType: true,
								},
							},
						},
					},
					service: {
						select: {
							name: true,
						},
					},
				},
			},
		},
	});
}

/**
 * Find sample by ID with full includes
 */
export async function findSampleById(sampleId: string) {
	return db.sampleTracking.findUnique({
		where: { id: sampleId },
		include: {
			bookingServiceItem: {
				include: {
					bookingRequest: {
						include: {
							user: {
								select: {
									firstName: true,
									lastName: true,
									userType: true,
								},
							},
						},
					},
					service: {
						select: {
							name: true,
						},
					},
				},
			},
		},
	});
}
