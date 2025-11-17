"use client";

import { ChevronDown } from "lucide-react";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/shared/ui/shadcn/popover";
import {
    ADMIN_DEFAULT_STATUS_FILTER,
    ADMIN_STATUS_LABELS,
} from "../model/admin-list.constants";
import type {
    AdminBookingStatus,
    AdminStatusCounts,
} from "../model/admin-list.types";
import { getAdminStatusColors } from "../model/admin-list.utils";

interface AdminStatusChipsProps {
    counts?: AdminStatusCounts;
    active: AdminBookingStatus[] | undefined;
    onChange: (status: AdminBookingStatus[] | undefined) => void;
}

export function AdminStatusChips({
    counts,
    active,
    onChange,
}: AdminStatusChipsProps) {
    const isAll = !active || active.length === 0;

    const isActiveStatus = (status: AdminBookingStatus) => {
        if (isAll) return false;
        return active?.includes(status);
    };

    const isPendingGroup =
        active?.length === 2 &&
        active.includes("pending_approval") &&
        active.includes("revision_submitted");

    // Primary / uncommon flags
    const isRevisionRequested = active?.length === 1 && active[0] === "revision_requested";
    const isCompleted = active?.length === 1 && active[0] === "completed";
    const isRejected = active?.length === 1 && active[0] === "rejected";
    const isCancelled = active?.length === 1 && active[0] === "cancelled";

    const handleChipClick = (
        statusOrGroup: AdminBookingStatus | "all" | "pending",
    ) => {
        if (statusOrGroup === "all") {
            onChange(undefined);
        } else if (statusOrGroup === "pending") {
            onChange([...ADMIN_DEFAULT_STATUS_FILTER]);
        } else {
            onChange([statusOrGroup]);
        }
    };

    const getChipClassName = (isActive: boolean, status?: string) => {
        if (isActive) {
            const colors = status ? getAdminStatusColors(status) : null;
            return `cursor-pointer rounded-full ${colors?.bg ?? "bg-slate-100"} ${colors?.text ?? "text-slate-800"} ring-2 ${colors?.ring ?? "ring-slate-500"} transition-all hover:opacity-90`;
        }
        return "cursor-pointer rounded-full bg-gray-100 text-gray-700 transition-all hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300";
    };

    const getMoreStatusLabel = () => {
        if (isRevisionRequested) return "Rev. Requested";
        if (isCompleted) return "Completed";
        if (isRejected) return "Rejected";
        if (isCancelled) return "Cancelled";
        return "More statuses";
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* All */}
            <Badge
                className={getChipClassName(isAll)}
                onClick={() => handleChipClick("all")}
                variant="secondary"
            >
                All {counts ? `(${counts.all})` : ""}
            </Badge>

            {/* Pending Group (default actionable) */}
            <Badge
                className={getChipClassName(isPendingGroup, "pending_approval")}
                onClick={() => handleChipClick("pending")}
                variant="secondary"
            >
                Pending{" "}
                {counts
                    ? `(${counts.pending_approval + counts.revision_submitted})`
                    : ""}
            </Badge>

            {/* In Progress (moved to primary chips) */}
            <Badge
                className={getChipClassName(isActiveStatus("in_progress"), "in_progress")}
                onClick={() => handleChipClick("in_progress")}
                variant="secondary"
            >
                {ADMIN_STATUS_LABELS.in_progress} {counts ? `(${counts.in_progress})` : ""}
            </Badge>

            {/* Approved */}
            <Badge
                className={getChipClassName(isActiveStatus("approved"), "approved")}
                onClick={() => handleChipClick("approved")}
                variant="secondary"
            >
                {ADMIN_STATUS_LABELS.approved} {counts ? `(${counts.approved})` : ""}
            </Badge>

            {/* "More statuses" dropdown for uncommon filters */}
            <Popover>
                <PopoverTrigger asChild>
                    <Badge
                        className={`cursor-pointer ${isRevisionRequested
                            ? `${getChipClassName(true, "revision_requested")} ring-2 ${getAdminStatusColors("revision_requested").ring
                            }`
                            : isCompleted
                                ? `${getChipClassName(true, "completed")} ring-2 ${getAdminStatusColors("completed").ring
                                }`
                                : isRejected
                                    ? `${getChipClassName(true, "rejected")} ring-2 ${getAdminStatusColors("rejected").ring
                                    }`
                                    : isCancelled
                                        ? `${getChipClassName(true, "cancelled")} ring-2 ${getAdminStatusColors("cancelled").ring
                                        }`
                                        : "rounded-full bg-gray-100 text-gray-700"
                            } transition-all hover:opacity-90`}
                        variant="secondary"
                    >
                        {getMoreStatusLabel()}{" "}
                        <ChevronDown className="ml-1 size-3" />
                    </Badge>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-48 p-2">
                    <div className="space-y-1">
                        <Button
                            className={
                                isRevisionRequested
                                    ? `w-full justify-between font-medium ${getAdminStatusColors("revision_requested").bg
                                    } ${getAdminStatusColors("revision_requested").text
                                    } hover:opacity-95`
                                    : "w-full justify-between"
                            }
                            onClick={() => handleChipClick("revision_requested")}
                            size="sm"
                            variant="ghost"
                        >
                            <span>{ADMIN_STATUS_LABELS.revision_requested}</span>
                            {counts && (
                                <span className="text-muted-foreground">
                                    ({counts.revision_requested})
                                </span>
                            )}
                        </Button>
                        <Button
                            className={
                                isCompleted
                                    ? `w-full justify-between font-medium ${getAdminStatusColors("completed").bg
                                    } ${getAdminStatusColors("completed").text
                                    } hover:opacity-95`
                                    : "w-full justify-between"
                            }
                            onClick={() => handleChipClick("completed")}
                            size="sm"
                            variant="ghost"
                        >
                            <span>{ADMIN_STATUS_LABELS.completed}</span>
                            {counts && (
                                <span className="text-muted-foreground">
                                    ({counts.completed})
                                </span>
                            )}
                        </Button>
                        <Button
                            className={
                                isRejected
                                    ? `w-full justify-between font-medium ${getAdminStatusColors("rejected").bg
                                    } ${getAdminStatusColors("rejected").text
                                    } hover:opacity-95`
                                    : "w-full justify-between"
                            }
                            onClick={() => handleChipClick("rejected")}
                            size="sm"
                            variant="ghost"
                        >
                            <span>{ADMIN_STATUS_LABELS.rejected}</span>
                            {counts && (
                                <span className="text-muted-foreground">
                                    ({counts.rejected})
                                </span>
                            )}
                        </Button>
                        <Button
                            className={
                                isCancelled
                                    ? `w-full justify-between font-medium ${getAdminStatusColors("cancelled").bg
                                    } ${getAdminStatusColors("cancelled").text
                                    } hover:opacity-95`
                                    : "w-full justify-between"
                            }
                            onClick={() => handleChipClick("cancelled")}
                            size="sm"
                            variant="ghost"
                        >
                            <span>{ADMIN_STATUS_LABELS.cancelled}</span>
                            {counts && (
                                <span className="text-muted-foreground">
                                    ({counts.cancelled})
                                </span>
                            )}
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
