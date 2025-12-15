"use client";

import {
	Check,
	Eye,
	MoreHorizontal,
	UserCheck,
	Users,
	UserX,
	X,
} from "lucide-react";
import { useMemo } from "react";
import type { UserListItemVM, UserType } from "@/entities/user/model/types";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/shared/ui/shadcn/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { type ColumnDef, DataTable } from "@/shared/ui/table";
import {
	formatDate,
	formatFullName,
	formatUserStatus,
	formatUserType,
	getUserStatusBadgeClass,
	getUserTypeBadgeClass,
} from "../lib/helpers";

interface UsersTableProps {
	users: UserListItemVM[];
	isLoading: boolean;
	selectedIds: Set<string>;
	onSelectAll: (checked: boolean, selectableIds: string[]) => void;
	onSelectRow: (id: string, checked: boolean) => void;
	onView: (id: string) => void;
	onApprove: (id: string) => void;
	onReject: (id: string) => void;
	onSuspend: (id: string) => void;
	onUnsuspend: (id: string) => void;
	onChangeUserType: (id: string, userType: UserType) => void;
}

const USER_TYPE_OPTIONS: { value: UserType; label: string }[] = [
	{ value: "mjiit_member", label: "MJIIT Member" },
	{ value: "utm_member", label: "UTM Member" },
	{ value: "external_member", label: "External User" },
	{ value: "lab_administrator", label: "Administrator" },
];

export function UsersTable({
	users,
	isLoading,
	selectedIds,
	onSelectAll,
	onSelectRow,
	onView,
	onApprove,
	onReject,
	onSuspend,
	onUnsuspend,
	onChangeUserType,
}: UsersTableProps) {
	// Define columns
	const columns: ColumnDef<UserListItemVM>[] = useMemo(
		() => [
			{
				id: "name",
				header: "Name",
				className: "min-w-[200px]",
				cell: ({ row }) => (
					<div>
						<div className="font-medium">
							{formatFullName(row.firstName, row.lastName)}
						</div>
						<div className="text-muted-foreground text-xs">{row.email}</div>
						{row.phone && (
							<div className="text-muted-foreground text-xs">{row.phone}</div>
						)}
					</div>
				),
			},
			{
				id: "userType",
				header: "Type",
				className: "w-[140px]",
				cell: ({ row }) => (
					<Badge className={getUserTypeBadgeClass(row.userType)}>
						{formatUserType(row.userType)}
					</Badge>
				),
			},
			{
				id: "organization",
				header: "Organization",
				className: "min-w-[180px]",
				cell: ({ row }) => {
					if (!row.organization) {
						return <span className="text-muted-foreground">-</span>;
					}

					if (row.userType === "external_member") {
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
				id: "identifier",
				header: "ID / Supervisor",
				className: "w-[160px]",
				cell: ({ row }) => (
					<div className="text-sm">
						{row.userIdentifier && (
							<div className="font-mono text-xs">{row.userIdentifier}</div>
						)}
						{row.supervisorName && (
							<div className="text-muted-foreground text-xs">
								SV: {row.supervisorName}
							</div>
						)}
						{!row.userIdentifier && !row.supervisorName && (
							<span className="text-muted-foreground">-</span>
						)}
					</div>
				),
			},
			{
				id: "status",
				header: "Status",
				className: "w-[120px]",
				cell: ({ row }) => (
					<Badge className={`ring-2 ${getUserStatusBadgeClass(row.status)}`}>
						{formatUserStatus(row.status)}
					</Badge>
				),
			},
			{
				id: "createdAt",
				header: "Registered",
				className: "w-[120px]",
				align: "right" as const,
				cell: ({ row }) => (
					<span className="text-sm">{formatDate(row.createdAt)}</span>
				),
			},
			{
				id: "actions",
				header: "Actions",
				className: "w-[100px]",
				align: "right" as const,
				cell: ({ row }) => {
					const isPending = row.status === "pending";
					const isActive = row.status === "active";
					const isSuspended = row.status === "suspended";

					return (
						<div className="flex justify-end gap-1">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										onClick={() => onView(row.id)}
										size="icon"
										variant="ghost"
									>
										<Eye className="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>View details</TooltipContent>
							</Tooltip>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button size="icon" variant="ghost">
										<MoreHorizontal className="size-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{isPending && (
										<>
											<DropdownMenuItem onClick={() => onApprove(row.id)}>
												<Check className="mr-2 size-4 text-green-600" />
												Approve
											</DropdownMenuItem>
											<DropdownMenuItem onClick={() => onReject(row.id)}>
												<X className="mr-2 size-4 text-red-600" />
												Reject
											</DropdownMenuItem>
										</>
									)}
									{isActive && (
										<DropdownMenuItem onClick={() => onSuspend(row.id)}>
											<UserX className="mr-2 size-4 text-orange-600" />
											Suspend
										</DropdownMenuItem>
									)}
									{isSuspended && (
										<DropdownMenuItem onClick={() => onUnsuspend(row.id)}>
											<UserCheck className="mr-2 size-4 text-green-600" />
											Reactivate
										</DropdownMenuItem>
									)}
									<DropdownMenuSeparator />
									<DropdownMenuSub>
										<DropdownMenuSubTrigger>
											<Users className="mr-2 size-4" />
											Change Type
										</DropdownMenuSubTrigger>
										<DropdownMenuSubContent>
											{USER_TYPE_OPTIONS.map((option) => (
												<DropdownMenuItem
													disabled={row.userType === option.value}
													key={option.value}
													onClick={() => onChangeUserType(row.id, option.value)}
												>
													{row.userType === option.value && (
														<Check className="mr-2 size-4" />
													)}
													{option.label}
												</DropdownMenuItem>
											))}
										</DropdownMenuSubContent>
									</DropdownMenuSub>
									{!isPending && (
										<>
											<DropdownMenuSeparator />
											<DropdownMenuItem onClick={() => onView(row.id)}>
												<Eye className="mr-2 size-4" />
												View Profile
											</DropdownMenuItem>
										</>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					);
				},
			},
		],
		[onView, onApprove, onReject, onSuspend, onUnsuspend, onChangeUserType],
	);

	// Only pending users can be selected for bulk actions
	const isRowSelectable = (row: UserListItemVM) => row.status === "pending";

	return (
		<DataTable
			columns={columns}
			data={users}
			emptyMessage="No users found"
			getRowId={(row) => row.id}
			isLoading={isLoading}
			selection={{
				selectedIds,
				onSelectAll,
				onSelectRow,
				isRowSelectable: (row) => isRowSelectable(row as UserListItemVM),
			}}
			skeletonRowCount={10}
		/>
	);
}
