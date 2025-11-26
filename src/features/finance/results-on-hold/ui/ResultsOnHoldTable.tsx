"use client";

import { AlertTriangle, Eye, Mail } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import type { ResultsOnHoldVM } from "@/entities/booking/server/finance-repository";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { type ColumnDef, DataTable } from "@/shared/ui/table";
import {
    formatCurrencyCompact,
    formatDate,
    getUserTypeBadgeClass,
    getUserTypeLabel,
} from "../../lib/helpers";

interface ResultsOnHoldTableProps {
    data: ResultsOnHoldVM[];
    isLoading: boolean;
    onSendReminder?: (booking: ResultsOnHoldVM) => void;
}

export function ResultsOnHoldTable({
    data,
    isLoading,
    onSendReminder,
}: ResultsOnHoldTableProps) {
    const columns: ColumnDef<ResultsOnHoldVM>[] = useMemo(
        () => [
            {
                id: "booking",
                header: "Booking Ref",
                className: "w-[140px]",
                cell: ({ row }) => (
                    <Link
                        className="font-mono text-blue-600 text-sm hover:underline"
                        href={`/admin/bookings/${row.id}`}
                    >
                        {row.referenceNumber}
                    </Link>
                ),
            },
            {
                id: "client",
                header: "Client",
                className: "min-w-[180px]",
                cell: ({ row }) => (
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{row.client.name}</span>
                            <Badge
                                className={getUserTypeBadgeClass(row.client.userType)}
                                variant="secondary"
                            >
                                {getUserTypeLabel(row.client.userType)}
                            </Badge>
                        </div>
                        {row.organization && (
                            <div className="text-muted-foreground text-xs">
                                {row.organization}
                            </div>
                        )}
                    </div>
                ),
            },
            {
                id: "samplesCompleted",
                header: "Samples Completed",
                className: "w-[150px]",
                align: "center",
                cell: ({ row }) => (
                    <Badge className="bg-green-100 text-green-800" variant="secondary">
                        {row.samplesCompleted} sample{row.samplesCompleted !== 1 ? "s" : ""}
                    </Badge>
                ),
            },
            {
                id: "totalDue",
                header: "Total Due",
                className: "w-[120px]",
                align: "right",
                cell: ({ row }) => (
                    <span className="font-medium text-red-600">
                        {formatCurrencyCompact(row.totalDue)}
                    </span>
                ),
            },
            {
                id: "daysSinceCompletion",
                header: "Days Since Completion",
                headerTooltip:
                    "Number of days since the first sample analysis was completed",
                className: "w-[180px]",
                align: "center",
                cell: ({ row }) => {
                    const days = row.daysSinceFirstCompletion;
                    const severity =
                        days > 30
                            ? "bg-red-100 text-red-800"
                            : days > 14
                                ? "bg-orange-100 text-orange-800"
                                : days > 7
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-700";

                    return (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge className={severity} variant="secondary">
                                    <AlertTriangle className="mr-1 size-3" />
                                    {days} days
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                First completion: {formatDate(row.earliestCompletionDate)}
                            </TooltipContent>
                        </Tooltip>
                    );
                },
            },
            {
                id: "gate",
                header: "Gate Status",
                className: "w-[100px]",
                align: "center",
                cell: () => (
                    <Badge className="bg-red-100 text-red-800" variant="secondary">
                        Locked
                    </Badge>
                ),
            },
            {
                id: "actions",
                header: "Actions",
                className: "w-[120px]",
                align: "right",
                cell: ({ row }) => (
                    <div className="flex justify-end gap-1">
                        {onSendReminder && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        className="text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                                        onClick={() => onSendReminder(row)}
                                        size="icon"
                                        variant="ghost"
                                    >
                                        <Mail className="size-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Send Payment Reminder</TooltipContent>
                            </Tooltip>
                        )}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button asChild size="icon" variant="ghost">
                                    <Link href={`/admin/bookings/${row.id}`}>
                                        <Eye className="size-4" />
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Open Booking</TooltipContent>
                        </Tooltip>
                    </div>
                ),
            },
        ],
        [onSendReminder],
    );

    return (
        <DataTable
            columns={columns}
            data={data}
            emptyMessage="No results on hold"
            getRowId={(row) => row.id}
            isLoading={isLoading}
            skeletonRowCount={10}
        />
    );
}
