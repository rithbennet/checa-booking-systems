"use client";

import { Checkbox } from "@/shared/ui/shadcn/checkbox";
import { Skeleton } from "@/shared/ui/shadcn/skeleton";
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
import type { ColumnDef, DataTableProps } from "./types";

/**
 * Default skeleton row component for loading state
 */
function DefaultSkeletonRow<T>({ columns }: { columns: ColumnDef<T>[] }) {
	return (
		<TableRow>
			{columns.map((column) => (
				<TableCell className={column.className} key={column.id}>
					<Skeleton
						className={`h-4 ${
							column.align === "right"
								? "ml-auto w-16"
								: column.align === "center"
									? "mx-auto w-20"
									: "w-24"
						}`}
					/>
				</TableCell>
			))}
		</TableRow>
	);
}

/**
 * Reusable data table component with support for:
 * - Custom column definitions
 * - Row selection (checkbox)
 * - Loading state with skeleton
 * - Empty state
 * - Row click handling
 * - Header tooltips
 */
export function DataTable<T>({
	columns,
	data,
	getRowId,
	isLoading = false,
	selection,
	emptyMessage = "No data found",
	emptyState,
	skeletonRowCount = 6,
	onRowClick,
	getRowClassName,
}: DataTableProps<T>) {
	// Selection logic
	const selectableRows = selection?.isRowSelectable
		? data.filter(selection.isRowSelectable)
		: data;
	const selectableIds = selectableRows.map(getRowId);
	const allSelected =
		selectableIds.length > 0 &&
		selectableIds.every((id) => selection?.selectedIds.has(id));
	const someSelected =
		selectableIds.some((id) => selection?.selectedIds.has(id)) && !allSelected;

	// Build columns with optional selection column
	const tableColumns: ColumnDef<T>[] = selection
		? [
				{
					id: "__selection",
					className: "w-[50px]",
					header: (
						<Checkbox
							aria-label="Select all"
							checked={allSelected || someSelected}
							disabled={selectableIds.length === 0}
							onCheckedChange={(checked) =>
								selection.onSelectAll(checked as boolean, selectableIds)
							}
						/>
					),
					cell: ({ row }) => {
						const id = getRowId(row);
						const isSelectable = selection.isRowSelectable
							? selection.isRowSelectable(row)
							: true;
						return (
							<Checkbox
								aria-label={`Select row ${id}`}
								checked={selection.selectedIds.has(id)}
								disabled={!isSelectable}
								onCheckedChange={(checked) =>
									selection.onSelectRow(id, checked as boolean)
								}
							/>
						);
					},
				},
				...columns,
			]
		: columns;

	// Render header cell
	const renderHeader = (column: ColumnDef<T>) => {
		const headerContent =
			typeof column.header === "function"
				? column.header({ column })
				: column.header;

		if (column.headerTooltip) {
			return (
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="cursor-help">{headerContent}</span>
					</TooltipTrigger>
					<TooltipContent>{column.headerTooltip}</TooltipContent>
				</Tooltip>
			);
		}

		return headerContent;
	};

	// Get alignment class
	const getAlignClass = (align?: "left" | "center" | "right") => {
		switch (align) {
			case "right":
				return "text-right";
			case "center":
				return "text-center";
			default:
				return "";
		}
	};

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						{tableColumns.map((column) => (
							<TableHead
								className={`${column.className || ""} ${getAlignClass(column.align)}`}
								key={column.id}
							>
								{renderHeader(column)}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{/* Data rows */}
					{data.map((row, rowIndex) => {
						const rowId = getRowId(row);
						const rowClassName = getRowClassName?.(row) || "";
						const isClickable = Boolean(onRowClick);

						return (
							<TableRow
								className={`${rowClassName} ${isClickable ? "cursor-pointer hover:bg-muted/50" : ""}`}
								key={rowId}
								onClick={onRowClick ? () => onRowClick(row) : undefined}
							>
								{tableColumns.map((column) => (
									<TableCell
										className={`${column.className || ""} ${getAlignClass(column.align)}`}
										key={column.id}
									>
										{column.cell({ row, rowIndex })}
									</TableCell>
								))}
							</TableRow>
						);
					})}

					{/* Loading skeleton */}
					{isLoading &&
						data.length === 0 &&
						Array.from({ length: skeletonRowCount }).map((_, index) => (
							<DefaultSkeletonRow
								columns={tableColumns}
								key={`skeleton-${
									// biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows don't need stable keys
									index
								}`}
							/>
						))}

					{/* Empty state */}
					{!isLoading && data.length === 0 && (
						<TableRow>
							<TableCell
								className="py-8 text-center text-muted-foreground"
								colSpan={tableColumns.length}
							>
								{emptyState || emptyMessage}
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
