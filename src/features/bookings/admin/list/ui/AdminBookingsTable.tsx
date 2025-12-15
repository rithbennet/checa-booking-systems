"use client";

import { Ban, Check, ExternalLink, Eye, Trash2, Undo2 } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { type ColumnDef, DataTable } from "@/shared/ui/table";
import { formatAmount, formatDate } from "../lib/admin-formatters";
import type { AdminBookingRowVM } from "../model/admin-list.types";
import {
	canPerformAction,
	getAdminStatusBadgeClassName,
	getAdminStatusColors,
} from "../model/admin-list.utils";

interface AdminBookingsTableProps {
	bookings: AdminBookingRowVM[];
	isLoading: boolean;
	selectedIds: Set<string>;
	onSelectAll: (checked: boolean, bookings: AdminBookingRowVM[]) => void;
	onSelectRow: (id: string, checked: boolean) => void;
	onDelete: (id: string) => void;
	onQuickView: (id: string) => void;
	onOpenDetail: (id: string) => void;
	onSingleAction: (
		id: string,
		action: "approve" | "reject" | "request_revision",
	) => void;
}

export function AdminBookingsTable({
	bookings,
	isLoading,
	selectedIds,
	onSelectAll,
	onSelectRow,
	onDelete,
	onQuickView,
	onOpenDetail,
	onSingleAction,
}: AdminBookingsTableProps) {
	// Define columns
	const columns: ColumnDef<AdminBookingRowVM>[] = useMemo(
		() => [
			{
				id: "reference",
				header: "Reference",
				headerTooltip: "Booking reference number",
				className: "w-[140px]",
				cell: ({ row }) => (
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
								onClick={() => onOpenDetail(row.id)}
								type="button"
							>
								{row.referenceNumber}
							</button>
						</TooltipTrigger>
						<TooltipContent>
							<div className="text-xs">
								<div>Created: {formatDate(row.createdAt)}</div>
								{row.hasWorkspace && (
									<div className="mt-1 text-amber-400">Includes workspace</div>
								)}
							</div>
						</TooltipContent>
					</Tooltip>
				),
			},
			{
				id: "requester",
				header: "Requester",
				className: "min-w-[180px]",
				cell: ({ row }) => (
					<div>
						<div className="font-medium text-sm">{row.user.name}</div>
						<div className="text-muted-foreground text-xs">
							{row.user.email}
						</div>
						<Badge
							className="mt-1 text-xs"
							variant={
								row.requesterType === "internal" ? "default" : "secondary"
							}
						>
							{row.requesterType}
						</Badge>
					</div>
				),
			},
			{
				id: "organization",
				header: "Organization",
				className: "min-w-[150px]",
				cell: ({ row }) => {
					if (!row.organization) {
						return <span className="text-muted-foreground">-</span>;
					}

					if (row.requesterType === "external") {
						return (
							<div className="text-sm">
								<div>{row.organization.company}</div>
								{row.organization.branch && (
									<div className="text-muted-foreground text-xs">
										{row.organization.branch}
									</div>
								)}
							</div>
						);
					}

					// Internal - show ikohza > faculty > department with tooltip
					return (
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="text-sm">
									{row.organization.ikohza ||
										row.organization.faculty ||
										row.organization.department ||
										"-"}
								</div>
							</TooltipTrigger>
							<TooltipContent className="max-w-xs">
								<div className="space-y-1 text-xs">
									{row.organization.ikohza && (
										<div>
											<span className="font-semibold">Ikohza:</span>{" "}
											{row.organization.ikohza}
										</div>
									)}
									{row.organization.faculty && (
										<div>
											<span className="font-semibold">Faculty:</span>{" "}
											{row.organization.faculty}
										</div>
									)}
									{row.organization.department && (
										<div>
											<span className="font-semibold">Department:</span>{" "}
											{row.organization.department}
										</div>
									)}
								</div>
							</TooltipContent>
						</Tooltip>
					);
				},
			},
			{
				id: "project",
				header: "Project",
				className: "min-w-[180px]",
				cell: ({ row }) =>
					row.projectTitle ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="line-clamp-2 text-sm">{row.projectTitle}</div>
							</TooltipTrigger>
							<TooltipContent className="max-w-xs">
								{row.projectTitle}
							</TooltipContent>
						</Tooltip>
					) : (
						<span className="text-muted-foreground text-sm">
							No description
						</span>
					),
			},
			{
				id: "status",
				header: "Status",
				className: "w-[120px]",
				cell: ({ row }) => (
					<Badge
						className={`${getAdminStatusBadgeClassName(row.status)} ring-2 ${getAdminStatusColors(row.status).ring}`}
					>
						{row.status.replace(/_/g, " ")}
					</Badge>
				),
			},
			{
				id: "amount",
				header: "Amount",
				className: "w-[120px]",
				align: "right" as const,
				cell: ({ row }) => formatAmount(Number(row.totalAmount)),
			},
			{
				id: "updated",
				header: "Updated",
				className: "w-[110px]",
				align: "right" as const,
				cell: ({ row }) => (
					<span className="text-sm">{formatDate(row.updatedAt)}</span>
				),
			},
			{
				id: "actions",
				header: "Actions",
				className: "w-[200px]",
				align: "right" as const,
				cell: ({ row }) => {
					const status = row.status;
					return (
						<div className="flex justify-end gap-1">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										onClick={() => onQuickView(row.id)}
										size="icon"
										variant="ghost"
									>
										<Eye className="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Quick view</TooltipContent>
							</Tooltip>

							{canPerformAction(status, "approve") && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											onClick={() => onSingleAction(row.id, "approve")}
											size="icon"
											variant="ghost"
										>
											<Check className="size-4 text-green-600" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Approve</TooltipContent>
								</Tooltip>
							)}

							{canPerformAction(status, "requestRevision") && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											onClick={() => onSingleAction(row.id, "request_revision")}
											size="icon"
											variant="ghost"
										>
											<Undo2 className="size-4 text-amber-600" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Request revision</TooltipContent>
								</Tooltip>
							)}

							{canPerformAction(status, "reject") && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											onClick={() => onSingleAction(row.id, "reject")}
											size="icon"
											variant="ghost"
										>
											<Ban className="size-4 text-red-600" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Reject</TooltipContent>
								</Tooltip>
							)}

							{canPerformAction(status, "delete") && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											onClick={() => onDelete(row.id)}
											size="icon"
											variant="ghost"
										>
											<Trash2 className="size-4 text-red-600" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Delete</TooltipContent>
								</Tooltip>
							)}

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										onClick={() => onOpenDetail(row.id)}
										size="icon"
										variant="ghost"
									>
										<ExternalLink className="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Open full page</TooltipContent>
							</Tooltip>
						</div>
					);
				},
			},
		],
		[onOpenDetail, onQuickView, onSingleAction, onDelete],
	);

	return (
		<DataTable
			columns={columns}
			data={bookings}
			emptyMessage="No bookings found"
			getRowId={(row) => row.id}
			isLoading={isLoading}
			selection={{
				selectedIds,
				onSelectAll: (checked, selectableIds) => {
					// Find the bookings that match these IDs
					const selectableBookings = bookings.filter((b) =>
						selectableIds.includes(b.id),
					);
					onSelectAll(checked, selectableBookings);
				},
				onSelectRow,
			}}
			skeletonRowCount={8}
		/>
	);
}
