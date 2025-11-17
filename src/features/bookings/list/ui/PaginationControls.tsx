"use client";

import { useQueryClient } from "@tanstack/react-query";
import { bookingsListKeys } from "@/entities/booking/api";
import { Button } from "@/shared/ui/shadcn/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/shadcn/select";
import type { FiltersState } from "../model/filters.schema";

interface PaginationControlsProps {
    currentPage: number;
    pageSize: number;
    total: number;
    rowsCount: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    params: FiltersState;
}

export function PaginationControls({
    currentPage,
    pageSize,
    total,
    rowsCount,
    isLoading,
    onPageChange,
    onPageSizeChange,
    params,
}: PaginationControlsProps) {
    const queryClient = useQueryClient();
    const totalPages = Math.ceil(total / pageSize) || 1;

    const handleNextPage = () => {
        onPageChange(currentPage + 1);
    };

    const handlePreviousPage = () => {
        onPageChange(Math.max(1, currentPage - 1));
    };

    const prefetchNextPage = () => {
        const nextParams = { ...params, page: currentPage + 1 };
        queryClient.prefetchQuery({
            queryKey: bookingsListKeys.list(nextParams),
            queryFn: () =>
                fetch(
                    `/api/bookings?page=${nextParams.page}&pageSize=${nextParams.pageSize}&sort=${nextParams.sort}&type=${nextParams.type || "all"}`,
                ).then((r) => r.json()),
        });
    };

    return (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            {/* Left: Total count */}
            <div className="flex items-center gap-4 text-muted-foreground text-sm">
                <span>
                    Showing{" "}
                    <span className="font-medium text-foreground">
                        {Math.min((currentPage - 1) * pageSize + 1, total)}
                    </span>
                    {" - "}
                    <span className="font-medium text-foreground">
                        {Math.min(currentPage * pageSize, total)}
                    </span>
                    {" of "}
                    <span className="font-medium text-foreground">{total}</span>
                </span>
            </div>

            {/* Center: Page navigation */}
            <div className="flex items-center gap-2">
                <Button
                    disabled={currentPage <= 1 || isLoading}
                    onClick={handlePreviousPage}
                    size="sm"
                    variant="outline"
                >
                    Previous
                </Button>
                <div className="flex items-center gap-1">
                    <span className="text-muted-foreground text-sm">Page</span>
                    <span className="min-w-[2ch] text-center font-medium text-sm">
                        {currentPage}
                    </span>
                    <span className="text-muted-foreground text-sm">of {totalPages}</span>
                </div>
                <Button
                    disabled={rowsCount < pageSize || isLoading}
                    onClick={handleNextPage}
                    onMouseEnter={prefetchNextPage}
                    size="sm"
                    variant="outline"
                >
                    Next
                </Button>
            </div>

            {/* Right: Items per page */}
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Items per page:</span>
                <Select
                    onValueChange={(v) => onPageSizeChange(Number(v))}
                    value={String(pageSize)}
                >
                    <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
