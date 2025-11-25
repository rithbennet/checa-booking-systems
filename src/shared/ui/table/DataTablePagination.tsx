"use client";

import { Button } from "@/shared/ui/shadcn/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/shadcn/select";
import type { DataTablePaginationProps } from "./types";

/**
 * Pagination controls for the DataTable
 * Shows current range, page navigation, and items per page selector
 */
export function DataTablePagination({
	currentPage,
	pageSize,
	total,
	rowsCount,
	isLoading = false,
	onPageChange,
	onPageSizeChange,
	pageSizeOptions = [10, 15, 25],
}: DataTablePaginationProps) {
	const totalPages = Math.ceil(total / pageSize) || 1;
	const startItem = Math.min((currentPage - 1) * pageSize + 1, total);
	const endItem = Math.min(currentPage * pageSize, total);

	const handleNextPage = () => {
		onPageChange(currentPage + 1);
	};

	const handlePreviousPage = () => {
		onPageChange(Math.max(1, currentPage - 1));
	};

	return (
		<div className="mt-4 flex flex-wrap items-center justify-between gap-4">
			{/* Left: Total count */}
			<div className="flex items-center gap-4 text-muted-foreground text-sm">
				<span>
					Showing{" "}
					<span className="font-medium text-foreground">{startItem}</span>
					{" - "}
					<span className="font-medium text-foreground">{endItem}</span>
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
						{pageSizeOptions.map((opt) => (
							<SelectItem key={opt} value={String(opt)}>
								{opt}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
