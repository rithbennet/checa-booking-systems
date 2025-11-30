/**
 * BookingStatusTimeline Component
 *
 * Visual progress timeline showing the booking workflow stages.
 */

"use client";

import type { booking_status_enum } from "generated/prisma";
import { Check, Loader2, Package } from "lucide-react";
import {
	getTimelineStep,
	isTimelineStepCompleted,
	isTimelineStepCurrent,
	type TimelineStep,
} from "@/entities/booking/model/command-center-types";

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

function TimelineStepItem({
	step,
	isCompleted,
	isCurrent,
	isUpcoming,
	dateStr,
	subtitle,
	showLine,
	isLineCompleted,
}: {
	step: StepConfig;
	isCompleted: boolean;
	isCurrent: boolean;
	isUpcoming: boolean;
	dateStr: string | null;
	subtitle: string | null;
	showLine: boolean;
	isLineCompleted: boolean;
}) {
	return (
		<div className="relative flex flex-1 flex-col items-center">
			{/* Connecting Line */}
			{showLine && (
				<div
					className={`-z-10 absolute top-3 left-[50%] h-0.5 w-full ${isLineCompleted ? "bg-green-500" : "bg-slate-200"
						}`}
				/>
			)}

			{/* Step Circle */}
			<div
				className={`z-10 mb-2 flex h-6 w-6 items-center justify-center rounded-full ${isCompleted ? "bg-green-500 text-white" : ""}
					${isCurrent ? "bg-blue-600 text-white ring-4 ring-blue-50" : ""}
					${isUpcoming ? "bg-slate-200 text-slate-400" : ""}
				`}
			>
				{isCompleted ? (
					<Check className="h-3 w-3" />
				) : isCurrent && step.key === "processing" ? (
					<Loader2 className="h-3 w-3 animate-spin" />
				) : (
					step.icon
				)}
			</div>

			{/* Label */}
			<span
				className={`font-bold text-xs ${isCompleted ? "text-green-700" : ""} ${isCurrent ? "text-blue-700" : ""} ${isUpcoming ? "text-slate-400" : ""}`}
			>
				{step.label}
			</span>

			{/* Date or Subtitle */}
			<span className="mt-1 block text-[10px] text-slate-400">
				{dateStr ?? subtitle ?? "\u00A0"}
			</span>
		</div>
	);
}

export function BookingStatusTimeline({
	status,
	dates,
	estimatedDays,
}: BookingStatusTimelineProps) {
	const currentStep = getTimelineStep(status);
	const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);

	return (
		<div className="mb-8 px-4">
			<div className="mx-auto flex max-w-5xl items-start">
				{STEPS.map((step, index) => {
					const isCompleted = isTimelineStepCompleted(currentStep, step.key);
					const isCurrent = isTimelineStepCurrent(currentStep, step.key);
					const isUpcoming = !isCompleted && !isCurrent;

					// Line logic: Show line if not the last item
					const showLine = index < STEPS.length - 1;
					// Line is completed if the NEXT step is completed or current
					const isLineCompleted = index < currentStepIndex;

					// Get corresponding date
					let dateStr: string | null = null;
					let subtitle: string | null = null;

					switch (step.key) {
						case "verified":
							dateStr = formatShortDate(dates?.verifiedAt);
							break;
						case "samples_in":
							dateStr = formatShortDate(dates?.samplesReceivedAt);
							break;
						case "processing":
							if (isCurrent && estimatedDays) {
								subtitle = `Est ${estimatedDays} Days`;
							} else {
								dateStr = formatShortDate(dates?.processingStartedAt);
							}
							break;
						case "payment":
							dateStr = formatShortDate(dates?.paidAt);
							break;
						case "released":
							dateStr = formatShortDate(dates?.releasedAt);
							break;
					}

					return (
						<TimelineStepItem
							dateStr={dateStr}
							isCompleted={isCompleted}
							isCurrent={isCurrent}
							isLineCompleted={isLineCompleted}
							isUpcoming={isUpcoming}
							key={step.key}
							showLine={showLine}
							step={step}
							subtitle={subtitle}
						/>
					);
				})}
			</div>
		</div>
	);
}
