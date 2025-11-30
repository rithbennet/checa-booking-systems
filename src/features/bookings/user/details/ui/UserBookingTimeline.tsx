/**
 * UserBookingTimeline Component
 *
 * Visual progress timeline showing the booking status progression.
 * Mirrors the admin BookingStatusTimeline with user-appropriate steps.
 */

"use client";

import {
	Check,
	CheckCircle,
	Clock,
	CreditCard,
	FileCheck,
	FlaskConical,
	Loader2,
	Package,
} from "lucide-react";
import type {
	UserBookingDetailVM,
	UserTimelineStep,
} from "@/entities/booking/model/user-detail-types";
import { getUserTimelineSteps } from "@/entities/booking/model/user-detail-types";
import { cn } from "@/shared/lib/utils";
import { formatShortDate } from "../lib/helpers";

interface UserBookingTimelineProps {
	booking: UserBookingDetailVM;
}

const stepIcons: Record<
	UserTimelineStep,
	React.ComponentType<{ className?: string }>
> = {
	submitted: FileCheck,
	approved: CheckCircle,
	samples_received: Package,
	in_progress: FlaskConical,
	paid: CreditCard,
	released: Check,
};

export function UserBookingTimeline({ booking }: UserBookingTimelineProps) {
	const steps = getUserTimelineSteps(booking);

	// Don't show timeline for draft or cancelled/rejected statuses
	if (
		booking.status === "draft" ||
		booking.status === "cancelled" ||
		booking.status === "rejected"
	) {
		return null;
	}

	return (
		<div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
			<h2 className="mb-4 font-semibold text-slate-900">Progress Timeline</h2>

			<div className="mx-auto flex max-w-5xl items-start px-4">
				{steps.map((step, index) => {
					const Icon = stepIcons[step.key];
					const isLast = index === steps.length - 1;
					const isUpcoming = !step.isCompleted && !step.isCurrent;

					// Line is completed if this step is completed
					const isLineCompleted = step.isCompleted;

					return (
						<div
							className="relative flex flex-1 flex-col items-center"
							key={step.key}
						>
							{/* Connecting Line */}
							{!isLast && (
								<div
									className={cn(
										"-z-10 absolute top-3 left-[50%] h-0.5 w-full",
										isLineCompleted ? "bg-green-500" : "bg-slate-200",
									)}
								/>
							)}

							{/* Step Circle */}
							<div
								className={cn(
									"z-10 mb-2 flex h-6 w-6 items-center justify-center rounded-full",
									step.isCompleted && "bg-green-500 text-white",
									step.isCurrent &&
										"bg-blue-600 text-white ring-4 ring-blue-50",
									isUpcoming && "bg-slate-200 text-slate-400",
								)}
							>
								{step.isCompleted ? (
									<Check className="h-3 w-3" />
								) : step.isCurrent && step.key === "in_progress" ? (
									<Loader2 className="h-3 w-3 animate-spin" />
								) : step.isCurrent ? (
									<Clock className="h-3 w-3" />
								) : (
									<Icon className="h-3 w-3" />
								)}
							</div>

							{/* Label */}
							<span
								className={cn(
									"font-bold text-xs",
									step.isCompleted && "text-green-700",
									step.isCurrent && "text-blue-700",
									isUpcoming && "text-slate-400",
								)}
							>
								{step.label}
							</span>

							{/* Date */}
							<span className="mt-1 block text-center text-[10px] text-slate-400">
								{step.date ? formatShortDate(step.date) : "\u00A0"}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
