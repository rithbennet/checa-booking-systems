/**
 * Workspace Booking Entity Queries
 * TanStack Query hooks for workspace schedule
 */

import { useQuery } from "@tanstack/react-query";
import { workspaceBookingKeys } from "./query-keys";
import type { WorkspaceEvent, WorkspaceScheduleRange } from "./types";

/**
 * Fetch workspace schedule for a date range
 */
async function fetchWorkspaceSchedule(
	from: Date | string,
	to: Date | string,
): Promise<WorkspaceScheduleRange> {
	const searchParams = new URLSearchParams();
	searchParams.set("from", from instanceof Date ? from.toISOString() : from);
	searchParams.set("to", to instanceof Date ? to.toISOString() : to);

	const res = await fetch(
		`/api/admin/workspace/schedule?${searchParams.toString()}`,
	);
	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		throw new Error(error.error || "Failed to fetch workspace schedule");
	}
	return res.json();
}

/**
 * Hook to get workspace schedule for a month range
 */
export function useWorkspaceScheduleForRange(
	monthStart: Date | string,
	monthEnd: Date | string,
) {
	return useQuery({
		queryKey: workspaceBookingKeys.scheduleRange(monthStart, monthEnd),
		queryFn: () => fetchWorkspaceSchedule(monthStart, monthEnd),
		staleTime: 5 * 60 * 1000, // 5 minutes - month-scoped caching
		keepPreviousData: true,
	});
}

/**
 * Selector utility to get events for a specific date from cached range
 */
export function selectEventsForDate(date: Date | string) {
	return (data: WorkspaceScheduleRange | undefined): WorkspaceEvent[] => {
		if (!data) return [];
		const targetDate = date instanceof Date ? date : new Date(date);
		const targetDateStr = targetDate.toISOString().split("T")[0];
		if (!targetDateStr) return [];

		return data.events.filter((event) => {
			const eventStart = new Date(event.startDate);
			const eventEnd = new Date(event.endDate);
			const eventStartStr = eventStart.toISOString().split("T")[0];
			const eventEndStr = eventEnd.toISOString().split("T")[0];

			// Check if target date falls within event range
			if (!eventStartStr || !eventEndStr) return false;
			return targetDateStr >= eventStartStr && targetDateStr <= eventEndStr;
		});
	};
}
