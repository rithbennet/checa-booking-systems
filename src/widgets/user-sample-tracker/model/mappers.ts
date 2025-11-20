/**
 * User Sample Tracker Widget Mappers
 * Adapt entity rows to widget display format
 */

import type { UserActiveSample } from "@/entities/sample-tracking/model/types";

export interface UserSampleWidgetItem {
	id: string;
	sampleIdentifier: string;
	serviceName: string;
	status: UserActiveSample["status"];
	bookingId: string;
}

/**
 * Map user active sample to widget item
 */
export function mapToWidgetItem(
	sample: UserActiveSample,
): UserSampleWidgetItem {
	return {
		id: sample.id,
		sampleIdentifier: sample.sampleIdentifier,
		serviceName: sample.serviceName,
		status: sample.status,
		bookingId: sample.bookingId,
	};
}
