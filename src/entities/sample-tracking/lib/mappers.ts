/**
 * Sample Tracking Mappers
 * Convert Prisma models to UI row shapes
 */

import type { SampleOperationsRow, UserActiveSample } from "../model/types";

/**
 * Prisma SampleTracking with includes for operations list
 */
type PrismaSampleTrackingWithIncludes = {
	id: string;
	sampleIdentifier: string;
	status: string;
	createdAt: Date;
	bookingServiceItem: {
		bookingRequest: {
			id: string;
			user: {
				firstName: string;
				lastName: string;
				userType: string;
			};
		};
		service: {
			name: string;
		};
	};
};

/**
 * Map Prisma SampleTracking to operations list row
 */
export function mapSampleToOperationsRow(
	sample: PrismaSampleTrackingWithIncludes,
): SampleOperationsRow {
	return {
		id: sample.id,
		sampleIdentifier: sample.sampleIdentifier,
		customerName: `${sample.bookingServiceItem.bookingRequest.user.firstName} ${sample.bookingServiceItem.bookingRequest.user.lastName}`,
		userType: sample.bookingServiceItem.bookingRequest.user.userType,
		serviceName: sample.bookingServiceItem.service.name,
		status: sample.status as SampleOperationsRow["status"],
		bookingId: sample.bookingServiceItem.bookingRequest.id,
		createdAt: sample.createdAt,
	};
}

/**
 * Map Prisma SampleTracking to user active sample (widget)
 */
export function mapSampleToUserActive(
	sample: PrismaSampleTrackingWithIncludes,
): UserActiveSample {
	return {
		id: sample.id,
		sampleIdentifier: sample.sampleIdentifier,
		serviceName: sample.bookingServiceItem.service.name,
		status: sample.status as UserActiveSample["status"],
		bookingId: sample.bookingServiceItem.bookingRequest.id,
		createdAt: sample.createdAt,
	};
}
