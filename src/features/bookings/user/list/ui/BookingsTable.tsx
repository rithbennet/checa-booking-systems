"use client";

import { Briefcase, Eye, Pencil, Trash2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import {
	getStatusBadgeClassName,
	getStatusColors,
	getStatusLabel,
} from "@/shared/lib/status-utils";
import RouterButton from "@/shared/ui/router-button";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { type ColumnDef, DataTable } from "@/shared/ui/table";

export interface BookingRow {
	id: string;
	reference: string;
	projectTitle: string | null;
	status: string;
	amountLabel: string;
	createdAtLabel: string;
	reviewNotes?: string | null;
	flags?: {
		hasWorkingSpace: boolean;
	};
}

interface BookingsTableProps {
	rows: BookingRow[];
	isLoading: boolean;
	selectedIds: Set<string>;
	onSelectAll: (checked: boolean, draftIds: string[]) => void;
	onSelectRow: (id: string, checked: boolean) => void;
	onDelete: (id: string) => void;
}

export function BookingsTable({
	rows,
	isLoading,
	selectedIds,
	onSelectAll,
	onSelectRow,
	onDelete,
}: BookingsTableProps) {
	// Helper to check if a row is editable (stable reference)
	const isRowEditable = useCallback(
		(row: BookingRow) =>
			row.status === "draft" || row.status === "revision_requested",
		[],
	);

	// Define columns
	const columns: ColumnDef<BookingRow>[] = useMemo(
		() => [
			{
				id: "reference",
				header: "Reference",
				headerTooltip: "Booking reference number",
				className: "w-[150px]",
				cell: ({ row }) => (
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="flex items-center gap-2 font-medium">
								<span className="truncate">{row.reference}</span>
								{row.flags?.hasWorkingSpace && (
									<Briefcase className="size-4 shrink-0 text-muted-foreground" />
								)}
							</div>
						</TooltipTrigger>
						<TooltipContent>
							<div>
								<div>{row.reference}</div>
								{row.flags?.hasWorkingSpace && (
									<div className="text-xs">Includes working space</div>
								)}
							</div>
						</TooltipContent>
					</Tooltip>
				),
			},
			{
				id: "project",
				header: "Project",
				className: "min-w-[200px] max-w-[300px]",
				cell: ({ row }) => (
					<Tooltip>
						<TooltipTrigger asChild>
							<div>
								{row.projectTitle ? (
									<span className="line-clamp-2">{row.projectTitle}</span>
								) : (
									<span className="text-gray-400">No description</span>
								)}
							</div>
						</TooltipTrigger>
						{row.projectTitle && (
							<TooltipContent className="max-w-xs">
								{row.projectTitle}
							</TooltipContent>
						)}
					</Tooltip>
				),
			},
			{
				id: "status",
				header: "Status",
				className: "w-[120px]",
				cell: ({ row }) => {
					const isRevisionRequested = row.status === "revision_requested";

					if (isRevisionRequested) {
						return (
							<Tooltip>
								<TooltipTrigger asChild>
									<Badge
										className={`${getStatusBadgeClassName(row.status)} ring-2 ${getStatusColors(row.status).ring} cursor-help`}
									>
										{getStatusLabel(row.status)}
									</Badge>
								</TooltipTrigger>
								<TooltipContent className="max-w-xs">
									<div>
										<p className="font-semibold">Admin has requested changes</p>
										{row.reviewNotes && (
											<p className="mt-1 text-xs">{row.reviewNotes}</p>
										)}
										<p className="mt-1 text-xs opacity-75">
											Click edit to revise your booking
										</p>
									</div>
								</TooltipContent>
							</Tooltip>
						);
					}

					return (
						<Badge
							className={`${getStatusBadgeClassName(row.status)} ring-2 ${getStatusColors(row.status).ring}`}
						>
							{getStatusLabel(row.status)}
						</Badge>
					);
				},
			},
			{
				id: "amount",
				header: "Amount",
				className: "w-[120px]",
				align: "right" as const,
				cell: ({ row }) => row.amountLabel,
			},
			{
				id: "created",
				header: "Created",
				className: "w-[120px]",
				align: "right" as const,
				cell: ({ row }) => row.createdAtLabel,
			},
			{
				id: "expected",
				header: "Expected",
				className: "w-[140px]",
				align: "right" as const,
				cell: () => <span className="text-muted-foreground">—</span>,
			},
			{
				id: "actions",
				header: "Actions",
				className: "w-[120px]",
				align: "right" as const,
				cell: ({ row }) => {
					const isEditable = isRowEditable(row);

					return (
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
							{isEditable && (
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
												onClick={() => onDelete(row.id)}
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
						</div>
					);
				},
			},
		],
		[onDelete, isRowEditable],
	);

	return (
		<DataTable
			columns={columns}
			data={rows}
			emptyMessage="No bookings found"
			getRowId={(row) => row.id}
			isLoading={isLoading}
			selection={{
				selectedIds,
				onSelectAll: (checked, selectableIds) => {
					onSelectAll(checked, selectableIds);
				},
				onSelectRow,
				isRowSelectable: (row) => isRowEditable(row as BookingRow),
			}}
			skeletonRowCount={6}
		/>
	);
}
