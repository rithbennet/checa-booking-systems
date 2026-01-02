"use client";

import { CalendarClock } from "lucide-react";
import type { BookingCommandCenterVM } from "@/entities/booking/model/command-center-types";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { formatDate, getDaysRemaining } from "../lib/helpers";

interface TimelineWidgetProps {
    booking: BookingCommandCenterVM;
}

export function TimelineWidget({ booking }: TimelineWidgetProps) {
    const targetDate = booking.preferredEndDate;
    const daysRemaining = getDaysRemaining(targetDate);

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold text-slate-900">
                    <CalendarClock className="h-4 w-4 text-slate-400" />
                    Timeline
                </h3>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className="cursor-not-allowed text-slate-400 text-xs"
                            type="button"
                        >
                            Edit
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Timeline editing coming soon</p>
                    </TooltipContent>
                </Tooltip>
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
    );
}
