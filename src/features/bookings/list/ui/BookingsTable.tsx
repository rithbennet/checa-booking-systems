"use client";

import { Briefcase, Eye, Pencil, Trash2 } from "lucide-react";
import RouterButton from "@/shared/ui/router-button";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import { Checkbox } from "@/shared/ui/shadcn/checkbox";
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
import {
	getStatusBadgeClassName,
	getStatusColors,
	getStatusLabel,
} from "../lib/statusUtils";
import { BookingListTableSkeleton } from "./BookingListTableSkeleton";

export interface BookingRow {
	id: string;
	reference: string;
	projectTitle: string | null;
	status: string;
	amountLabel: string;
	createdAtLabel: string;
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
	const draftRows = rows.filter((r) => r.status === "draft");
	const allDraftsSelected =
		draftRows.length > 0 && draftRows.every((r) => selectedIds.has(r.id));
	const someDraftsSelected =
		draftRows.some((r) => selectedIds.has(r.id)) && !allDraftsSelected;

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[50px]">
							<Checkbox
								aria-label="Select all"
								checked={allDraftsSelected || someDraftsSelected}
								disabled={draftRows.length === 0}
								onCheckedChange={(checked) =>
									onSelectAll(
										checked as boolean,
										draftRows.map((r) => r.id),
									)
								}
							/>
						</TableHead>
						<TableHead className="w-[150px]">
							<Tooltip>
								<TooltipTrigger>Reference</TooltipTrigger>
								<TooltipContent>Booking reference number</TooltipContent>
							</Tooltip>
						</TableHead>
						<TableHead className="min-w-[200px]">Project</TableHead>
						<TableHead className="w-[120px]">Status</TableHead>
						<TableHead className="w-[120px] text-right">Amount</TableHead>
						<TableHead className="w-[120px] text-right">Created</TableHead>
						<TableHead className="w-[140px] text-right">Expected</TableHead>
						<TableHead className="w-[120px] text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((row) => {
						const isSelected = selectedIds.has(row.id);
						const isDraft = row.status === "draft";

						return (
							<TableRow key={row.id}>
								<TableCell>
									<Checkbox
										aria-label={`Select ${row.reference}`}
										checked={isSelected}
										disabled={!isDraft}
										onCheckedChange={(checked) =>
											onSelectRow(row.id, checked as boolean)
										}
									/>
								</TableCell>
								<TableCell className="font-medium">
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="flex items-center gap-2">
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
								</TableCell>
								<TableCell className="max-w-[300px]">
									<Tooltip>
										<TooltipTrigger asChild>
											<div>
												{row.projectTitle ? (
													<span className="line-clamp-2">
														{row.projectTitle}
													</span>
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
								</TableCell>
								<TableCell>
									<Badge
										className={`${getStatusBadgeClassName(
											row.status,
										)} ring-2 ${getStatusColors(row.status).ring}`}
									>
										{getStatusLabel(row.status)}
									</Badge>
								</TableCell>
								<TableCell className="text-right">{row.amountLabel}</TableCell>
								<TableCell className="text-right">
									{row.createdAtLabel}
								</TableCell>
								<TableCell className="text-right text-muted-foreground">
									—
								</TableCell>
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
										{isDraft && (
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
								</TableCell>
							</TableRow>
						);
					})}
					{isLoading && rows.length === 0 && <BookingListTableSkeleton />}
					{!isLoading && rows.length === 0 && (
						<TableRow>
							<TableCell className="py-8 text-center text-gray-500" colSpan={8}>
								No bookings found
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
