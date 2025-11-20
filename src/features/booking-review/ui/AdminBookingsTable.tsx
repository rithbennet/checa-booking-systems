"use client";

import { Ban, Check, ExternalLink, Eye, Trash2, Undo2 } from "lucide-react";
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
import { formatAmount, formatDate } from "../lib/admin-formatters";
import type { AdminBookingRowVM } from "../model/admin-list.types";
import {
	canPerformAction,
	getAdminStatusBadgeClassName,
	getAdminStatusColors,
} from "../model/admin-list.utils";
import { AdminBookingsTableSkeleton } from "./AdminBookingsTableSkeleton";

interface AdminBookingsTableSimpleProps {
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
}: AdminBookingsTableSimpleProps) {
	const allSelected =
		bookings.length > 0 && bookings.every((b) => selectedIds.has(b.id));
	const someSelected =
		bookings.some((b) => selectedIds.has(b.id)) && !allSelected;

	if (isLoading) {
		return (
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[50px]">
								<Checkbox aria-label="Select all" disabled />
							</TableHead>
							<TableHead className="w-[140px]">Reference</TableHead>
							<TableHead className="min-w-[180px]">Requester</TableHead>
							<TableHead className="min-w-[150px]">Organization</TableHead>
							<TableHead className="min-w-[180px]">Project</TableHead>
							<TableHead className="w-[120px]">Status</TableHead>
							<TableHead className="w-[120px] text-right">Amount</TableHead>
							<TableHead className="w-[110px] text-right">Updated</TableHead>
							<TableHead className="w-[200px] text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						<AdminBookingsTableSkeleton />
					</TableBody>
				</Table>
			</div>
		);
	}

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[50px]">
							<Checkbox
								aria-label="Select all"
								checked={allSelected || someSelected}
								disabled={bookings.length === 0}
								onCheckedChange={(checked) =>
									onSelectAll(checked as boolean, bookings)
								}
							/>
						</TableHead>
						<TableHead className="w-[140px]">
							<Tooltip>
								<TooltipTrigger>Reference</TooltipTrigger>
								<TooltipContent>Booking reference number</TooltipContent>
							</Tooltip>
						</TableHead>
						<TableHead className="min-w-[180px]">Requester</TableHead>
						<TableHead className="min-w-[150px]">Organization</TableHead>
						<TableHead className="min-w-[180px]">Project</TableHead>
						<TableHead className="w-[120px]">Status</TableHead>
						<TableHead className="w-[120px] text-right">Amount</TableHead>
						<TableHead className="w-[110px] text-right">Updated</TableHead>
						<TableHead className="w-[200px] text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{bookings.map((booking) => {
						const isSelected = selectedIds.has(booking.id);
						const status = booking.status;

						return (
							<TableRow data-state={isSelected && "selected"} key={booking.id}>
								{/* Checkbox */}
								<TableCell>
									<Checkbox
										aria-label={`Select ${booking.referenceNumber}`}
										checked={isSelected}
										onCheckedChange={(checked) =>
											onSelectRow(booking.id, checked as boolean)
										}
									/>
								</TableCell>

								{/* Reference */}
								<TableCell className="font-medium">
									<Tooltip>
										<TooltipTrigger asChild>
											<button
												className="text-blue-600 hover:text-blue-800 hover:underline"
												onClick={() => onOpenDetail(booking.id)}
												type="button"
											>
												{booking.referenceNumber}
											</button>
										</TooltipTrigger>
										<TooltipContent>
											<div className="text-xs">
												<div>Created: {formatDate(booking.createdAt)}</div>
												{booking.hasWorkspace && (
													<div className="mt-1 text-amber-400">
														Includes workspace
													</div>
												)}
											</div>
										</TooltipContent>
									</Tooltip>
								</TableCell>

								{/* Requester */}
								<TableCell>
									<div>
										<div className="font-medium text-sm">
											{booking.user.name}
										</div>
										<div className="text-muted-foreground text-xs">
											{booking.user.email}
										</div>
										<Badge
											className="mt-1 text-xs"
											variant={
												booking.requesterType === "internal"
													? "default"
													: "secondary"
											}
										>
											{booking.requesterType}
										</Badge>
									</div>
								</TableCell>

								{/* Organization */}
								<TableCell>
									{booking.organization ? (
										booking.requesterType === "external" ? (
											// External organization
											<div className="text-sm">
												<div>{booking.organization.company}</div>
												{booking.organization.branch && (
													<div className="text-muted-foreground text-xs">
														{booking.organization.branch}
													</div>
												)}
											</div>
										) : (
											// Internal (university) - show ikohza > faculty > department with tooltip
											<Tooltip>
												<TooltipTrigger asChild>
													<div className="text-sm">
														{booking.organization.ikohza ||
															booking.organization.faculty ||
															booking.organization.department ||
															"-"}
													</div>
												</TooltipTrigger>
												<TooltipContent className="max-w-xs">
													<div className="space-y-1 text-xs">
														{booking.organization.ikohza && (
															<div>
																<span className="font-semibold">Ikohza:</span>{" "}
																{booking.organization.ikohza}
															</div>
														)}
														{booking.organization.faculty && (
															<div>
																<span className="font-semibold">Faculty:</span>{" "}
																{booking.organization.faculty}
															</div>
														)}
														{booking.organization.department && (
															<div>
																<span className="font-semibold">
																	Department:
																</span>{" "}
																{booking.organization.department}
															</div>
														)}
													</div>
												</TooltipContent>
											</Tooltip>
										)
									) : (
										<span className="text-muted-foreground">-</span>
									)}
								</TableCell>

								{/* Project */}
								<TableCell>
									{booking.projectTitle ? (
										<Tooltip>
											<TooltipTrigger asChild>
												<div className="line-clamp-2 text-sm">
													{booking.projectTitle}
												</div>
											</TooltipTrigger>
											<TooltipContent className="max-w-xs">
												{booking.projectTitle}
											</TooltipContent>
										</Tooltip>
									) : (
										<span className="text-muted-foreground text-sm">
											No description
										</span>
									)}
								</TableCell>

								{/* Status */}
								<TableCell>
									<Badge
										className={`${getAdminStatusBadgeClassName(
											status,
										)} ring-2 ${getAdminStatusColors(status).ring}`}
									>
										{status.replace(/_/g, " ")}
									</Badge>
								</TableCell>

								{/* Amount */}
								<TableCell className="text-right">
									{formatAmount(Number(booking.totalAmount))}
								</TableCell>

								{/* Updated */}
								<TableCell className="text-right text-sm">
									{formatDate(booking.updatedAt)}
								</TableCell>

								{/* Actions */}
								<TableCell className="text-right">
									<div className="flex justify-end gap-1">
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													onClick={() => onQuickView(booking.id)}
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
														onClick={() =>
															onSingleAction(booking.id, "approve")
														}
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
														onClick={() =>
															onSingleAction(booking.id, "request_revision")
														}
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
														onClick={() => onSingleAction(booking.id, "reject")}
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
														onClick={() => onDelete(booking.id)}
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
													onClick={() => onOpenDetail(booking.id)}
													size="icon"
													variant="ghost"
												>
													<ExternalLink className="size-4" />
												</Button>
											</TooltipTrigger>
											<TooltipContent>Open full page</TooltipContent>
										</Tooltip>
									</div>
								</TableCell>
							</TableRow>
						);
					})}
					{!isLoading && bookings.length === 0 && (
						<TableRow>
							<TableCell className="py-8 text-center" colSpan={10}>
								No bookings found
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
