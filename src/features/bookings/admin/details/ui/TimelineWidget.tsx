"use client";

import { CalendarClock, Loader2 } from "lucide-react";
import { useState } from "react";
import { useUpdateBookingTimeline } from "@/entities/booking/api";
import type { BookingCommandCenterVM } from "@/entities/booking/model/command-center-types";
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
 */
function formatDateToYMD(value?: string | Date | null): string {
    if (!value) return "";
    const isoString = new Date(value).toISOString();
    const datePart = isoString.split("T")[0];
    return datePart ?? "";
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

    const updateTimeline = useUpdateBookingTimeline();

    const targetDate = booking.preferredEndDate;
    const daysRemaining = getDaysRemaining(targetDate);
    const isCancelled = booking.status === "cancelled";

    const handleSave = async () => {
        try {
            await updateTimeline.mutateAsync({
                bookingId: booking.id,
                preferredStartDate: startDate || null,
                preferredEndDate: endDate || null,
            });
            setIsEditOpen(false);
        } catch (error) {
            console.error("Failed to update timeline:", error);
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (open) {
            // Reset form when opening
            setStartDate(formatDateToYMD(booking.preferredStartDate));
            setEndDate(formatDateToYMD(booking.preferredEndDate));
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
