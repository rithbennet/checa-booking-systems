"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, RefreshCw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
	useApproveUser,
	useRejectUser,
	userKeys,
	useUpdateUserStatus,
	useUpdateUserType,
	useUserCounts,
	useUserList,
} from "@/entities/user";
import type {
	UserSortKey,
	UserStatus,
	UserType,
} from "@/entities/user/model/types";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/shadcn/select";
import {
	type ActionDef,
	type BulkActionDef,
	DataTableBulkActions,
	DataTablePagination,
	DataTableStatusChips,
	DataTableToolbar,
	type FilterDef,
	STATUS_CHIP_COLORS,
	type StatusChipOption,
} from "@/shared/ui/table";
import { useUserListParams } from "../lib/useUserListParams";
import { UsersTable } from "./UsersTable";

export function UserListPage() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const { params, setParams, searchInput, setSearchInput } =
		useUserListParams();

	// Fetch data
	const { data, isLoading, isFetching } = useUserList(params);
	const { data: counts } = useUserCounts();

	const items = data?.items ?? [];
	const total = data?.total ?? 0;

	// Selection state
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	// Mutations
	const { mutateAsync: approveUser, isPending: isApproving } = useApproveUser();
	const { mutateAsync: rejectUser, isPending: isRejecting } = useRejectUser();
	const { mutateAsync: updateStatus } = useUpdateUserStatus();
	const { mutateAsync: updateUserType } = useUpdateUserType();

	const handleRefresh = () => {
		queryClient.invalidateQueries({ queryKey: userKeys.all });
		toast.success("Refreshing", {
			description: "Fetching latest user data...",
		});
	};

	const handleSelectAll = (checked: boolean, selectableIds: string[]) => {
		if (checked) {
			setSelectedIds(new Set(selectableIds));
		} else {
			setSelectedIds(new Set());
		}
	};

	const handleSelectRow = (id: string, checked: boolean) => {
		const newSelection = new Set(selectedIds);
		if (checked) {
			newSelection.add(id);
		} else {
			newSelection.delete(id);
		}
		setSelectedIds(newSelection);
	};

	const handleApprove = async (userId: string) => {
		try {
			await approveUser({ userId });
			toast.success("User approved");
			queryClient.invalidateQueries({ queryKey: userKeys.all });
		} catch (error) {
			toast.error("Failed to approve user", {
				description:
					error instanceof Error ? error.message : "An error occurred",
			});
		}
	};

	const handleReject = async (userId: string) => {
		try {
			await rejectUser({ userId });
			toast.success("User rejected");
			queryClient.invalidateQueries({ queryKey: userKeys.all });
		} catch (error) {
			toast.error("Failed to reject user", {
				description:
					error instanceof Error ? error.message : "An error occurred",
			});
		}
	};

	const handleSuspend = async (userId: string) => {
		try {
			await updateStatus({ userId, status: "suspended" });
			toast.success("User suspended");
			queryClient.invalidateQueries({ queryKey: userKeys.all });
		} catch (error) {
			toast.error("Failed to suspend user", {
				description:
					error instanceof Error ? error.message : "An error occurred",
			});
		}
	};

	const handleUnsuspend = async (userId: string) => {
		try {
			await updateStatus({ userId, status: "active" });
			toast.success("User reactivated");
			queryClient.invalidateQueries({ queryKey: userKeys.all });
		} catch (error) {
			toast.error("Failed to reactivate user", {
				description:
					error instanceof Error ? error.message : "An error occurred",
			});
		}
	};

	const handleBulkApprove = async (ids: string[]) => {
		try {
			await Promise.all(ids.map((userId) => approveUser({ userId })));
			toast.success(`Approved ${ids.length} user(s)`);
			setSelectedIds(new Set());
			queryClient.invalidateQueries({ queryKey: userKeys.all });
		} catch (error) {
			toast.error("Some approvals failed", {
				description:
					error instanceof Error ? error.message : "An error occurred",
			});
		}
	};

	const handleBulkReject = async (ids: string[]) => {
		try {
			await Promise.all(ids.map((userId) => rejectUser({ userId })));
			toast.success(`Rejected ${ids.length} user(s)`);
			setSelectedIds(new Set());
			queryClient.invalidateQueries({ queryKey: userKeys.all });
		} catch (error) {
			toast.error("Some rejections failed", {
				description:
					error instanceof Error ? error.message : "An error occurred",
			});
		}
	};

	const handleView = (userId: string) => {
		router.push(`/admin/users/${userId}`);
	};

	const handleChangeUserType = async (userId: string, userType: UserType) => {
		try {
			await updateUserType({ userId, userType });
			toast.success("User type updated", {
				description: `User type changed to ${userType}`,
			});
			queryClient.invalidateQueries({ queryKey: userKeys.all });
		} catch (error) {
			toast.error("Failed to update user type", {
				description:
					error instanceof Error ? error.message : "An error occurred",
			});
		}
	};

	// Status chip options with counts and colors
	const statusChipOptions: StatusChipOption<UserStatus | undefined>[] = [
		{
			value: undefined,
			label: "All",
			count: counts?.all,
			activeClassName: STATUS_CHIP_COLORS.all,
		},
		{
			value: "pending",
			label: "Pending",
			count: counts?.pending,
			activeClassName: STATUS_CHIP_COLORS.pending,
		},
		{
			value: "active",
			label: "Active",
			count: counts?.active,
			activeClassName: STATUS_CHIP_COLORS.active,
		},
		{
			value: "inactive",
			label: "Inactive",
			count: counts?.inactive,
			activeClassName: STATUS_CHIP_COLORS.inactive,
		},
		{
			value: "rejected",
			label: "Rejected",
			count: counts?.rejected,
			activeClassName: STATUS_CHIP_COLORS.rejected,
		},
		{
			value: "suspended",
			label: "Suspended",
			count: counts?.suspended,
			activeClassName: STATUS_CHIP_COLORS.suspended,
		},
	];

	// User type filter options
	const userTypeOptions = [
		{
			value: "__all__",
			label: "All Types",
			icon: <div className="size-2 rounded-full bg-blue-500" />,
		},
		{
			value: "mjiit_member",
			label: "MJIIT Members",
			icon: <div className="size-2 rounded-full bg-purple-500" />,
		},
		{
			value: "utm_member",
			label: "UTM Members",
			icon: <div className="size-2 rounded-full bg-green-500" />,
		},
		{
			value: "external_member",
			label: "External Users",
			icon: <div className="size-2 rounded-full bg-indigo-500" />,
		},
		{
			value: "lab_administrator",
			label: "Administrators",
			icon: <div className="size-2 rounded-full bg-slate-500" />,
		},
	];

	// Sort options shown beside refresh
	const sortOptions: { value: UserSortKey; label: string }[] = [
		{ value: "created_newest", label: "Registered (newest)" },
		{ value: "created_oldest", label: "Registered (oldest)" },
		{ value: "name_asc", label: "Name (A-Z)" },
		{ value: "name_desc", label: "Name (Z-A)" },
	];

	// Filters displayed inline beside refresh (sort only in row 1)
	const filters: FilterDef[] = [
		{
			id: "sort",
			label: "",
			type: "select",
			options: sortOptions.map((opt) => ({
				value: opt.value,
				label: opt.label,
			})),
			value: params.sort,
			onChange: (value) =>
				setParams({ sort: value as UserSortKey }, { preservePage: true }),
			placeholder: "Sort by",
			className: "w-[200px]",
		},
	];

	// Define toolbar actions (only refresh; sort and type filters are inline via filters prop)
	const toolbarActions: ActionDef[] = [
		{
			id: "refresh",
			label: "",
			icon: isFetching ? (
				<Loader2 className="size-4 animate-spin" />
			) : (
				<RefreshCw className="size-4" />
			),
			onClick: handleRefresh,
			disabled: isFetching,
			tooltip: isFetching ? "Refreshing..." : "Refresh list",
			variant: "outline",
		},
	];

	// Define bulk actions
	const bulkActions: BulkActionDef[] = [
		{
			id: "approve",
			label: "Approve All",
			icon: <Check className="size-4" />,
			onClick: handleBulkApprove,
			loading: isApproving,
			variant: "default",
		},
		{
			id: "reject",
			label: "Reject All",
			icon: <X className="size-4" />,
			onClick: handleBulkReject,
			loading: isRejecting,
			variant: "destructive",
		},
	];

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-6">
				<h1 className="font-bold text-3xl">User Management</h1>
				<p className="mt-2 text-muted-foreground">
					Manage user registrations and accounts
				</p>
			</div>

			{/* Toolbar: Row 1 - Search, Refresh, Sort */}
			<DataTableToolbar
				actions={toolbarActions}
				filters={filters}
				onSearchChange={setSearchInput}
				searchPlaceholder="Search by name, email, or ID..."
				searchValue={searchInput}
				showSearchIcon
			>
				{/* Row 2: Status Chips */}
				<div className="pt-2">
					<DataTableStatusChips
						active={params.status}
						label="Status:"
						onChange={(status) => setParams({ status })}
						options={statusChipOptions}
					/>
				</div>

				{/* Row 3: Type Filter */}
				<div className="flex flex-wrap items-center gap-4">
					<Select
						onValueChange={(v) =>
							setParams({
								userType: v === "__all__" ? undefined : (v as UserType | "all"),
							})
						}
						value={
							params.userType && params.userType !== "all"
								? params.userType
								: "__all__"
						}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="All Types" />
						</SelectTrigger>
						<SelectContent>
							{userTypeOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									<div className="flex items-center gap-2">
										{option.icon}
										<span>{option.label}</span>
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</DataTableToolbar>

			{/* Bulk Actions Toolbar */}
			<DataTableBulkActions
				actions={bulkActions}
				onClearSelection={() => setSelectedIds(new Set())}
				selectedCount={selectedIds.size}
				selectedIds={Array.from(selectedIds)}
			/>

			{/* Table */}
			<UsersTable
				isLoading={isLoading}
				onApprove={handleApprove}
				onChangeUserType={handleChangeUserType}
				onReject={handleReject}
				onSelectAll={handleSelectAll}
				onSelectRow={handleSelectRow}
				onSuspend={handleSuspend}
				onUnsuspend={handleUnsuspend}
				onView={handleView}
				selectedIds={selectedIds}
				users={items}
			/>

			{/* Pagination */}
			<DataTablePagination
				currentPage={params.page}
				isLoading={isLoading}
				onPageChange={(page) => setParams({ page }, { preservePage: true })}
				onPageSizeChange={(pageSize) =>
					setParams({ pageSize: pageSize as 10 | 25 | 50 })
				}
				pageSize={params.pageSize}
				pageSizeOptions={[10, 25, 50]}
				rowsCount={items.length}
				total={total}
			/>
		</div>
	);
}
