/**
 * Workspace Booking Mappers
 * Convert Prisma models to calendar event DTOs
 */

import type { WorkspaceEvent } from "../model/types";

/**
 * Prisma WorkspaceBooking with includes for schedule
 */
type PrismaWorkspaceBookingWithIncludes = {
	id: string;
	startDate: Date;
	endDate: Date;
	preferredTimeSlot: string | null;
	purpose: string | null;
	bookingRequest: {
		user: {
			firstName: string;
			lastName: string;
		};
	};
};

/**
 * Map Prisma WorkspaceBooking to calendar event
 */
export function mapWorkspaceToEvent(
	workspace: PrismaWorkspaceBookingWithIncludes,
): WorkspaceEvent {
	return {
		id: workspace.id,
		userName: `${workspace.bookingRequest.user.firstName} ${workspace.bookingRequest.user.lastName}`,
		startDate: workspace.startDate,
		endDate: workspace.endDate,
		timeSlot: workspace.preferredTimeSlot ?? null,
		purpose: workspace.purpose ?? null,
	};
}
