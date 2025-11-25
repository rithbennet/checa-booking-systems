"use client";

import { Skeleton } from "@/shared/ui/shadcn/skeleton";
import { TableCell, TableRow } from "@/shared/ui/shadcn/table";

interface DataTableSkeletonProps {
	/** Number of columns to render */
	columnCount: number;
	/** Number of rows to render */
	rowCount?: number;
	/** Whether to include a checkbox column */
	hasSelection?: boolean;
	/** Whether to include an actions column */
	hasActions?: boolean;
}

/**
 * Skeleton loading component for table rows
 * Can be used inside TableBody for custom loading states
 */
export function DataTableSkeleton({
	columnCount,
	rowCount = 6,
	hasSelection = false,
	hasActions = false,
}: DataTableSkeletonProps) {
	const dataColumns = Array.from({ length: columnCount }, (_, i) => i);

	return (
		<>
			{Array.from({ length: rowCount }, (_, rowIndex) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows are static, no reordering
				<TableRow key={`skeleton-row-${rowIndex}`}>
					{/* Selection column */}
					{hasSelection && (
						<TableCell className="w-[50px]">
							<Skeleton className="size-4" />
						</TableCell>
					)}

					{/* Data columns */}
					{dataColumns.map((colIndex) => (
						<TableCell key={`skeleton-cell-${rowIndex}-${colIndex}`}>
							<Skeleton
								className={`h-4 ${
									colIndex === 0
										? "w-24"
										: colIndex === 1
											? "w-48"
											: colIndex === dataColumns.length - 1
												? "ml-auto w-16"
												: "w-20"
								}`}
							/>
						</TableCell>
					))}

					{/* Actions column */}
					{hasActions && (
						<TableCell className="text-right">
							<div className="flex justify-end gap-2">
								<Skeleton className="size-9 rounded-md" />
								<Skeleton className="size-9 rounded-md" />
							</div>
						</TableCell>
					)}
				</TableRow>
			))}
		</>
	);
}
