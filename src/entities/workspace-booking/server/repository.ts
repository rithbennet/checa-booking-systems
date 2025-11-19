/**
 * Workspace Booking Repository
 * Data access layer for workspace booking operations
 */

import { db } from "@/shared/server/db";

/**
 * Find workspace bookings for a date range with approved/in_progress/completed status
 */
export async function findWorkspaceScheduleRange(params: {
	from: Date;
	to: Date;
}) {
	const { from, to } = params;

	return db.workspaceBooking.findMany({
		where: {
			bookingRequest: {
				status: {
					in: ["approved", "in_progress", "completed"],
				},
			},
			OR: [
				// Overlap: existing start <= to AND existing end >= from
				{
					AND: [{ startDate: { lte: to } }, { endDate: { gte: from } }],
				},
			],
		},
		include: {
			bookingRequest: {
				include: {
					user: {
						select: {
							firstName: true,
							lastName: true,
						},
					},
				},
			},
		},
		orderBy: {
			startDate: "asc",
		},
	});
}
