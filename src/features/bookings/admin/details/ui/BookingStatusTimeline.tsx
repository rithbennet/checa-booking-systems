/**
 * BookingStatusTimeline Component
 *
 * Visual progress timeline showing the booking workflow stages.
 * Includes edit functionality for admin users to update milestone dates.
 */

"use client";

import type { booking_status_enum } from "generated/prisma";
import { Check, Edit2, Loader2, Package } from "lucide-react";
import { useState } from "react";
import {
	getTimelineStep,
	isTimelineStepCompleted,
	isTimelineStepCurrent,
	type TimelineStep,
} from "@/entities/booking/model/command-center-types";
import { Button } from "@/shared/ui/shadcn/button";
import { Calendar } from "@/shared/ui/shadcn/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shared/ui/shadcn/popover";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";

interface BookingStatusTimelineProps {
	status: booking_status_enum;
	dates?: {
		verifiedAt?: string | null;
		samplesReceivedAt?: string | null;
		processingStartedAt?: string | null;
		paidAt?: string | null;
		releasedAt?: string | null;
	};
	estimatedDays?: number;
}

interface StepConfig {
	key: TimelineStep;
	label: string;
	icon: React.ReactNode;
}

const STEPS: StepConfig[] = [
	{
		key: "verified",
		label: "Verified",
		icon: <Check className="h-3 w-3" />,
	},
	{
		key: "samples_in",
		label: "Samples In",
		icon: <Package className="h-3 w-3" />,
	},
	{
		key: "processing",
		label: "Processing",
		icon: <Loader2 className="h-3 w-3" />,
	},
	{
		key: "payment",
		label: "Payment",
		icon: <Check className="h-3 w-3" />,
	},
	{
		key: "released",
		label: "Released",
		icon: <Check className="h-3 w-3" />,
	},
];

function formatShortDate(dateStr: string | null | undefined): string | null {
	if (!dateStr) return null;
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// TimelineStep component with edit capability
function TimelineStepItem({
	step,
	isCompleted,
	isCurrent,
	isUpcoming,
	dateStr,
	isoDate,
	subtitle,
	isEditMode,
	onDateSelect,
}: {
	step: StepConfig;
	isCompleted: boolean;
	isCurrent: boolean;
	isUpcoming: boolean;
	dateStr: string | null;
	isoDate?: string | null;
	subtitle: string | null;
	isEditMode: boolean;
	onDateSelect: (step: TimelineStep, date: Date | undefined) => void;
}) {
	const [calendarOpen, setCalendarOpen] = useState(false);

	return (
		<div className="flex flex-col items-center text-center" key={step.key}>
			{/* Step Circle */}
			<div
				className={`flex h-6 w-6 items-center justify-center rounded-full mb-2${isCompleted ? "bg-green-500 text-white" : ""}
					${isCurrent ? "bg-blue-600 text-white ring-4 ring-blue-50" : ""}
					${isUpcoming ? "bg-slate-200" : ""}
				`}
			>
				{isCompleted && <Check className="h-3 w-3" />}
				{isCurrent &&
					(step.key === "processing" ? (
						<Loader2 className="h-3 w-3 animate-spin" />
					) : (
						step.icon
					))}
			</div>

			{/* Label */}
			<span
				className={`font-bold text-xs ${isCompleted ? "text-green-700" : ""} ${isCurrent ? "text-blue-700" : ""} ${isUpcoming ? "text-slate-400" : ""}`}
			>
				{step.label}
			</span>

			{/* Date or Subtitle with edit capability */}
			{isEditMode && !isUpcoming ? (
				<Popover onOpenChange={setCalendarOpen} open={calendarOpen}>
					<PopoverTrigger asChild>
						<button
							className="group flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700"
							type="button"
						>
							{dateStr ?? "Set date"}
							<Edit2 className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100" />
						</button>
					</PopoverTrigger>
					<PopoverContent align="center" className="w-auto p-0">
						<Calendar
							initialFocus
							mode="single"
							onSelect={(date) => {
								onDateSelect(step.key, date);
								setCalendarOpen(false);
							}}
							selected={isoDate ? new Date(isoDate) : undefined}
						/>
					</PopoverContent>
				</Popover>
			) : (
				<span className="block text-[10px] text-slate-400">
					{dateStr ?? subtitle ?? "\u00A0"}
				</span>
			)}
		</div>
	);
}

export function BookingStatusTimeline({
	status,
	dates,
	estimatedDays,
}: BookingStatusTimelineProps) {
	const [isEditMode, setIsEditMode] = useState(false);
	const currentStep = getTimelineStep(status);

	// Handler for date selection (TODO: integrate with API)
	const handleDateSelect = (step: TimelineStep, date: Date | undefined) => {
		// This would call an API to update the timeline date
		console.log("Timeline date change:", step, date);
		// For now, just log - API integration would be added later
	};

	return (
		<div className="mb-8 px-4">
			{/* Edit toggle */}
			<div className="mx-auto mb-2 flex max-w-5xl justify-end">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className="h-6 gap-1 px-2 text-[10px]"
							onClick={() => setIsEditMode(!isEditMode)}
							size="sm"
							variant={isEditMode ? "secondary" : "ghost"}
						>
							<Edit2 className="h-3 w-3" />
							{isEditMode ? "Done Editing" : "Edit Timeline"}
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Timeline date editing (API integration coming soon)</p>
					</TooltipContent>
				</Tooltip>
			</div>
			<div className="mx-auto flex max-w-5xl items-center justify-between">
				{STEPS.map((step) => {
					const isCompleted = isTimelineStepCompleted(currentStep, step.key);
					const isCurrent = isTimelineStepCurrent(currentStep, step.key);
					const isUpcoming = !isCompleted && !isCurrent;

					// Get corresponding date (both formatted display and raw ISO)
					let dateStr: string | null = null;
					let isoDate: string | null = null;
					let subtitle: string | null = null;

					switch (step.key) {
						case "verified":
							dateStr = formatShortDate(dates?.verifiedAt);
							isoDate = dates?.verifiedAt ?? null;
							break;
						case "samples_in":
							dateStr = formatShortDate(dates?.samplesReceivedAt);
							isoDate = dates?.samplesReceivedAt ?? null;
							break;
						case "processing":
							if (isCurrent && estimatedDays) {
								subtitle = `Est ${estimatedDays} Days`;
							} else {
								dateStr = formatShortDate(dates?.processingStartedAt);
								isoDate = dates?.processingStartedAt ?? null;
							}
							break;
						case "payment":
							dateStr = formatShortDate(dates?.paidAt);
							isoDate = dates?.paidAt ?? null;
							break;
						case "released":
							dateStr = formatShortDate(dates?.releasedAt);
							isoDate = dates?.releasedAt ?? null;
							break;
					}

					return (
						<TimelineStepItem
							dateStr={dateStr}
							isCompleted={isCompleted}
							isCurrent={isCurrent}
							isEditMode={isEditMode}
							isoDate={isoDate}
							isUpcoming={isUpcoming}
							key={step.key}
							onDateSelect={handleDateSelect}
							step={step}
							subtitle={subtitle}
						/>
					);
				})}
			</div>
		</div>
	);
}
