"use client";

import { CalendarClock, Loader2 } from "lucide-react";
import { useState } from "react";
import { useUpdateBookingTimeline } from "@/entities/booking/api";
import type { BookingCommandCenterVM } from "@/entities/booking/model/command-center-types";
import { Alert, AlertDescription } from "@/shared/ui/shadcn/alert";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { formatDate, getDaysRemaining } from "../lib/helpers";

/**
 * Format a date value to YYYY-MM-DD string for date inputs
 * Returns empty string for falsy inputs
 * Uses UTC methods to prevent timezone shifts
 */
function formatDateToYMD(value?: string | Date | null): string {
	if (!value) return "";

	// If value is already an ISO string, extract the date portion directly
	if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
		return value.slice(0, 10);
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";

	// Use UTC methods to preserve the original date without timezone shifts
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

interface TimelineWidgetProps {
	booking: BookingCommandCenterVM;
}

export function TimelineWidget({ booking }: TimelineWidgetProps) {
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [startDate, setStartDate] = useState<string>(
		formatDateToYMD(booking.preferredStartDate),
	);
	const [endDate, setEndDate] = useState<string>(
		formatDateToYMD(booking.preferredEndDate),
	);
	const [validationError, setValidationError] = useState<string | null>(null);

	const updateTimeline = useUpdateBookingTimeline();

	const targetDate = booking.preferredEndDate;
	const daysRemaining = getDaysRemaining(targetDate);
	const isCancelled = booking.status === "cancelled";

	const handleSave = async () => {
		// Clear previous validation error
		setValidationError(null);

		// Validate that start date is before or equal to end date
		if (startDate && endDate) {
			const start = new Date(startDate);
			const end = new Date(endDate);
			if (start > end) {
				setValidationError("Start date must be before or equal to end date");
				return;
			}
		}

		try {
			await updateTimeline.mutateAsync({
				bookingId: booking.id,
				preferredStartDate: startDate || null,
				preferredEndDate: endDate || null,
			});
			setIsEditOpen(false);
		} catch (error) {
			console.error("Failed to update timeline:", error);
			// Error is handled by mutation error UI below
		}
	};

	const handleOpenChange = (open: boolean) => {
		if (open) {
			// Reset form when opening
			setStartDate(formatDateToYMD(booking.preferredStartDate));
			setEndDate(formatDateToYMD(booking.preferredEndDate));
			setValidationError(null);
		}
		setIsEditOpen(open);
	};

	return (
		<>
			<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="flex items-center gap-2 font-bold text-slate-900">
						<CalendarClock className="h-4 w-4 text-slate-400" />
						Timeline
					</h3>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									className={
										isCancelled
											? "cursor-not-allowed text-slate-400 text-xs"
											: "cursor-pointer text-blue-600 text-xs hover:underline"
									}
									disabled={isCancelled}
									onClick={() => !isCancelled && setIsEditOpen(true)}
									type="button"
								>
									Edit
								</button>
							</TooltipTrigger>
							{isCancelled && (
								<TooltipContent>
									<p>Cannot edit cancelled bookings</p>
								</TooltipContent>
							)}
						</Tooltip>
					</TooltipProvider>
				</div>

				<div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
					<p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">
						Target Completion
					</p>
					<p className="font-bold text-lg text-slate-900">
						{targetDate ? formatDate(targetDate) : "Not set"}
					</p>
					{daysRemaining !== null && (
						<p className="mt-0.5 text-[10px] text-slate-500">
							{daysRemaining > 0
								? `${daysRemaining} days remaining`
								: daysRemaining === 0
									? "Due today"
									: `${Math.abs(daysRemaining)} days overdue`}
						</p>
					)}
				</div>
			</div>

			<Dialog onOpenChange={handleOpenChange} open={isEditOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Edit Timeline</DialogTitle>
						<DialogDescription>
							Update the preferred start and end dates for this booking.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="startDate">Preferred Start Date</Label>
							<Input
								id="startDate"
								onChange={(e) => setStartDate(e.target.value)}
								type="date"
								value={startDate}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="endDate">Target Completion Date</Label>
							<Input
								id="endDate"
								onChange={(e) => setEndDate(e.target.value)}
								type="date"
								value={endDate}
							/>
						</div>
					</div>

					{/* Error Display */}
					{validationError && (
						<Alert className="border-red-200 bg-red-50" role="alert">
							<AlertDescription className="text-red-800 text-sm">
								{validationError}
							</AlertDescription>
						</Alert>
					)}
					{updateTimeline.isError && (
						<Alert className="border-red-200 bg-red-50" role="alert">
							<AlertDescription className="text-red-800 text-sm">
								{updateTimeline.error instanceof Error
									? updateTimeline.error.message
									: "Failed to update timeline"}
							</AlertDescription>
						</Alert>
					)}

					<DialogFooter>
						<Button
							disabled={updateTimeline.isPending}
							onClick={() => setIsEditOpen(false)}
							variant="outline"
						>
							Cancel
						</Button>
						<Button disabled={updateTimeline.isPending} onClick={handleSave}>
							{updateTimeline.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Save Changes
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
