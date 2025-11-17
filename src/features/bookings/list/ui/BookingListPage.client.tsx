"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Briefcase, Eye, Pencil, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { bookingsListKeys } from "@/entities/booking/api/use-bookings-list";
import RouterButton from "@/shared/ui/router-button";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import { Input } from "@/shared/ui/shadcn/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/shadcn/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/shadcn/table";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { SORT_OPTIONS } from "../lib/tableConfig";
import { useListData } from "../lib/useListData";
import { useListParams } from "../lib/useListParams";
import type { SortKey } from "../model/filters.schema";
import { canSeeAmount } from "../model/list.permissions";
import { toRow } from "../model/list.selectors";
import { BookingListTableSkeleton } from "./BookingListTableSkeleton";
import { StatusChips } from "./StatusChips";

export function BookingListPageClient({
    userStatus,
}: {
    userStatus: string | null;
}) {
    const queryClient = useQueryClient();
    const { params, setParams, qInput, setQInput } = useListParams();
    const { items, total, isLoading, counts } = useListData(params);

    const showAmount = canSeeAmount(userStatus);
    const rows = useMemo(
        () => items.map((i) => toRow(i, showAmount)),
        [items, showAmount],
    );

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this draft booking? This cannot be undone.")) return;
        const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
        if (res.ok) {
            // Invalidate list and counts
            await queryClient.invalidateQueries({ queryKey: bookingsListKeys.root });
        } else {
            const err = await res.json().catch(() => ({}));
            alert(err.error || "Failed to delete booking");
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h1 className="font-bold text-3xl">My Bookings</h1>
                    <p className="mt-2 text-gray-600">
                        View and manage your lab service bookings
                    </p>
                </div>
                <RouterButton href="/bookings/new">New Booking</RouterButton>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="w-full sm:w-64">
                    <Input
                        onChange={(e) => setQInput(e.target.value)}
                        placeholder="Search bookings..."
                        value={qInput}
                    />
                </div>
                <StatusChips
                    active={params.status}
                    counts={counts}
                    onChange={(next) => setParams({ status: next })}
                />
                <div className="flex items-center gap-2">
                    <Badge
                        className={
                            params.type === "all" ? "ring-2 ring-primary" : "cursor-pointer"
                        }
                        onClick={() => setParams({ type: "all" })}
                        variant="secondary"
                    >
                        All
                    </Badge>
                    <Badge
                        className={
                            params.type === "analysis_only"
                                ? "ring-2 ring-primary"
                                : "cursor-pointer"
                        }
                        onClick={() => setParams({ type: "analysis_only" })}
                        variant="secondary"
                    >
                        Analysis
                    </Badge>
                    <Badge
                        className={
                            params.type === "working_space"
                                ? "ring-2 ring-primary"
                                : "cursor-pointer"
                        }
                        onClick={() => setParams({ type: "working_space" })}
                        variant="secondary"
                    >
                        Workspace
                    </Badge>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Select
                        onValueChange={(v) => setParams({ sort: v as SortKey })}
                        value={params.sort}
                    >
                        <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            {SORT_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Reference</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <span>{row.reference}</span>
                                        {row.flags?.hasWorkingSpace && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Briefcase className="size-4 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>Includes working space</TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-[360px]">
                                    {row.projectTitle ? (
                                        <span className="line-clamp-1">{row.projectTitle}</span>
                                    ) : (
                                        <span className="text-gray-400">No description</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{row.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">{row.amountLabel}</TableCell>
                                <TableCell>{row.createdAtLabel}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <RouterButton
                                                    href={`/bookings/${row.id}`}
                                                    size="icon"
                                                    variant="ghost"
                                                >
                                                    <Eye className="size-4" />
                                                </RouterButton>
                                            </TooltipTrigger>
                                            <TooltipContent>View</TooltipContent>
                                        </Tooltip>
                                        {/* Edit/Delete for drafts */}
                                        {row.status === "draft" && (
                                            <>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <RouterButton
                                                            href={`/bookings/${row.id}/edit`}
                                                            size="icon"
                                                            variant="ghost"
                                                        >
                                                            <Pencil className="size-4" />
                                                        </RouterButton>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Edit</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            onClick={() => handleDelete(row.id)}
                                                            size="icon"
                                                            variant="ghost"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Delete</TooltipContent>
                                                </Tooltip>
                                            </>
                                        )}
                                        {/* Duplicate action (optional) */}
                                        {/* <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button size="icon" variant="ghost">
                                                    <Copy className="size-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Duplicate</TooltipContent>
                                        </Tooltip> */}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {isLoading && rows.length === 0 && <BookingListTableSkeleton />}
                        {!isLoading && rows.length === 0 && (
                            <TableRow>
                                <TableCell
                                    className="py-8 text-center text-gray-500"
                                    colSpan={6}
                                >
                                    No bookings found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
                <div className="text-gray-600 text-sm">Total: {total}</div>
                <div className="flex items-center gap-2">
                    <Button
                        disabled={params.page <= 1}
                        onClick={() => setParams({ page: Math.max(1, params.page - 1) })}
                        variant="outline"
                    >
                        Previous
                    </Button>
                    <div className="text-sm">Page {params.page}</div>
                    <Button
                        disabled={rows.length < params.pageSize}
                        onClick={() => setParams({ page: params.page + 1 })}
                        onMouseEnter={() => {
                            // Prefetch next page in background for snappier pagination
                            const nextParams = { ...params, page: params.page + 1 };
                            queryClient.prefetchQuery({
                                queryKey: bookingsListKeys.list(nextParams),
                                queryFn: () =>
                                    fetch(
                                        `/api/bookings?page=${nextParams.page}&pageSize=${nextParams.pageSize}&sort=${nextParams.sort}&type=${nextParams.type || "all"}`,
                                    ).then((r) => r.json()),
                            });
                        }}
                        variant="outline"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
