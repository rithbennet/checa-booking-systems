/**
 * Workspace Booking Service Actions
 * Business logic layer for workspace booking operations
 */

import { mapWorkspaceToEvent } from "../lib/mappers";
import * as repo from "./repository";

/**
 * Get workspace schedule for a date range
 */
export async function getWorkspaceSchedule(params: {
	from: Date | string;
	to: Date | string;
}) {
	const from =
		params.from instanceof Date ? params.from : new Date(params.from);
	const to = params.to instanceof Date ? params.to : new Date(params.to);

	// Validate dates
	if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
		throw new Error("Invalid date format");
	}

	if (from > to) {
		throw new Error("from date must be before to date");
	}

	const workspaceBookings = await repo.findWorkspaceScheduleRange({ from, to });

	const events = workspaceBookings.map(mapWorkspaceToEvent);

	return {
		events,
		from: params.from,
		to: params.to,
	};
}
