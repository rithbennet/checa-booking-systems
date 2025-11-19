"use client";

import {
	addMonths,
	endOfMonth,
	format,
	startOfMonth,
	subMonths,
} from "date-fns";
import { useMemo, useState } from "react";
import {
	selectEventsForDate,
	useWorkspaceScheduleForRange,
} from "@/entities/workspace-booking/model/queries";
import { Calendar } from "@/shared/ui/shadcn/calendar";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";

export function WorkspaceOverviewSection() {
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

	// Calculate month range for query
	const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
	const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);

	const { data: scheduleData, isLoading } = useWorkspaceScheduleForRange(
		monthStart,
		monthEnd,
	);

	// Get events for selected date from cached range
	const selectedDateEvents = useMemo(() => {
		if (!scheduleData) return [];
		return selectEventsForDate(selectedDate)(scheduleData);
	}, [scheduleData, selectedDate]);

	const _handleMonthChange = (direction: "prev" | "next") => {
		setCurrentMonth((prev) =>
			direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1),
		);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="font-bold text-2xl text-gray-900">Workspace Overview</h2>
				<p className="mt-1 text-gray-600 text-sm">
					View workspace bookings and daily schedules
				</p>
			</div>

			{/* Calendar and Schedule */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Calendar */}
				<Card>
					<CardHeader>
						<CardTitle>Calendar</CardTitle>
					</CardHeader>
					<CardContent>
						<Calendar
							className="rounded-md border"
							mode="single"
							month={currentMonth}
							onMonthChange={setCurrentMonth}
							onSelect={(date) => date && setSelectedDate(date)}
							selected={selectedDate}
						/>
					</CardContent>
				</Card>

				{/* Daily Schedule */}
				<Card>
					<CardHeader>
						<CardTitle>
							Schedule - {format(selectedDate, "MMMM d, yyyy")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="py-8 text-center text-muted-foreground text-sm">
								Loading schedule...
							</div>
						) : selectedDateEvents.length === 0 ? (
							<div className="py-8 text-center text-muted-foreground text-sm">
								No workspace bookings for this date
							</div>
						) : (
							<div className="space-y-3">
								{selectedDateEvents.map((event) => (
									<div
										className="space-y-1 rounded-lg border p-4"
										key={event.id}
									>
										<div className="font-medium">{event.userName}</div>
										{event.timeSlot && (
											<div className="text-muted-foreground text-sm">
												Time: {event.timeSlot}
											</div>
										)}
										{event.purpose && (
											<div className="text-muted-foreground text-sm">
												Purpose: {event.purpose}
											</div>
										)}
										<div className="text-muted-foreground text-xs">
											{format(new Date(event.startDate), "MMM d")} -{" "}
											{format(new Date(event.endDate), "MMM d, yyyy")}
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
