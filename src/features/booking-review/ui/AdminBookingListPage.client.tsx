"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PaginationControls } from "@/shared/ui/PaginationControls";
import { SearchBar } from "@/shared/ui/SearchBar";
import {
	useAdminBookingCounts,
	useAdminBookingList,
	useAdminBulkAction,
	useDeleteBooking,
} from "../lib/useAdminBookingList";
import { useAdminListParams } from "../lib/useAdminListParams";
import { AdminActionBar } from "./AdminActionBar";
import { AdminBookingActionDialog } from "./AdminBookingActionDialog";
import { AdminBookingsTable } from "./AdminBookingsTable";
import { AdminBulkActionsToolbar } from "./AdminBulkActionsToolbar";
import { AdminStatusChips } from "./AdminStatusChips";
import { AdminTypeFilter } from "./AdminTypeFilter";
import { AdminQuickViewDialog } from "./admin-quick-view";

export function AdminBookingListPage() {
	const queryClient = useQueryClient();
	const { params, setParams, qInput, setQInput } = useAdminListParams();

	// Fetch data
	const { data, isLoading, isFetching } = useAdminBookingList(params);
	const { data: counts } = useAdminBookingCounts();

	const items = data?.items ?? [];
	const total = data?.total ?? 0;

	// Selection state
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	// Dialog states
	const [quickViewId, setQuickViewId] = useState<string | null>(null);
	const [actionDialogState, setActionDialogState] = useState<{
		bookingId: string;
		action: "approve" | "reject" | "request_revision";
	} | null>(null);

	// Mutations
	const { mutateAsync: bulkAction, isPending: isBulkActing } =
		useAdminBulkAction();
	const { mutateAsync: deleteBooking } = useDeleteBooking();

	const handleRefresh = () => {
		queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
		toast.success("Refreshing", {
			description: "Fetching latest booking data...",
		});
	};

	const handleSelectAll = (
		checked: boolean,
		bookings: typeof items,
	) => {
		if (checked) {
			const newSelection = new Set(bookings.map((item) => item.id));
			setSelectedIds(newSelection);
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

	const handleBulkAction = async (
		action: "approve" | "reject" | "request_revision" | "delete",
		comment?: string,
	) => {
		const ids = Array.from(selectedIds);
		if (ids.length === 0) return;

		try {
			if (action === "delete") {
				// Delete each booking
				await Promise.all(ids.map((id) => deleteBooking(id)));
				toast.success(`Deleted ${ids.length} booking(s)`);
			} else {
				// Perform bulk action
				const result = await bulkAction({
					ids,
					action,
					comment,
				});
				toast.success(result.message);
			}
			setSelectedIds(new Set());
		} catch (error) {
			toast.error("Action failed", {
				description:
					error instanceof Error ? error.message : "An error occurred",
			});
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteBooking(id);
			toast.success("Booking deleted");
		} catch (error) {
			toast.error("Delete failed", {
				description:
					error instanceof Error ? error.message : "An error occurred",
			});
		}
	};

	const handleSingleAction = (
		id: string,
		action: "approve" | "reject" | "request_revision",
	) => {
		setActionDialogState({ bookingId: id, action });
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-6">
				<h1 className="font-bold text-3xl">Booking Management</h1>
				<p className="mt-2 text-gray-600">
					Review and manage all booking requests
				</p>
			</div>

			{/* Filters Section */}
			<div className="mb-6 space-y-4">
				{/* Row 1: Search and Actions */}
				<div className="flex items-center gap-3">
					<SearchBar
						autoFocus
						onChange={setQInput}
						placeholder="Search by reference, user, or project..."
						showSearchIcon
						value={qInput}
					/>
					<AdminActionBar
						isRefreshing={isFetching}
						onRefresh={handleRefresh}
						onSortChange={(v) => setParams({ sort: v })}
						sortValue={params.sort}
					/>
				</div>

				{/* Row 2: Status Chips */}
				<div className="flex flex-wrap items-center gap-2">
					<span className="font-medium text-muted-foreground text-sm">
						Status:
					</span>
					<AdminStatusChips
						active={params.status}
						counts={counts}
						onChange={(next) => setParams({ status: next })}
					/>
				</div>

				{/* Row 3: Type Filter */}
				<div className="flex items-center justify-between gap-3">
					<AdminTypeFilter
						onChange={(v) => setParams({ type: v })}
						value={params.type ?? "all"}
					/>
				</div>

				{/* Search results message */}
				{qInput && (
					<div className="text-muted-foreground text-sm">
						Showing {total} result{total !== 1 ? "s" : ""} for "{qInput}"
					</div>
				)}
			</div>

			{/* Bulk Actions Toolbar */}
			<AdminBulkActionsToolbar
				isProcessing={isBulkActing}
				onApprove={() => handleBulkAction("approve")}
				onClearSelection={() => setSelectedIds(new Set())}
				onDelete={() => handleBulkAction("delete")}
				onReject={() => handleBulkAction("reject")}
				onRequestRevision={() => handleBulkAction("request_revision")}
				selectedCount={selectedIds.size}
			/>

			{/* Table */}
			<AdminBookingsTable
				bookings={items}
				isLoading={isLoading}
				onDelete={handleDelete}
				onOpenDetail={(id: string) =>
					window.open(`/admin/bookings/${id}`, "_self")
				}
				onQuickView={setQuickViewId}
				onSelectAll={handleSelectAll}
				onSelectRow={handleSelectRow}
				onSingleAction={handleSingleAction}
				selectedIds={selectedIds}
			/>

			{/* Pagination */}
			<PaginationControls
				currentPage={params.page}
				isLoading={isLoading}
				onPageChange={(page: number) =>
					setParams({ page }, { preservePage: true })
				}
				onPageSizeChange={(pageSize) =>
					setParams({ pageSize: pageSize as typeof params.pageSize })
				}
				pageSize={params.pageSize}
				pageSizeOptions={[25, 50, 100]}
				params={params}
				rowsCount={items.length}
				total={total}
			/>

			{/* Dialogs */}
			{quickViewId && (
				<AdminQuickViewDialog
					bookingId={quickViewId}
					onClose={() => setQuickViewId(null)}
					onOpenFullPage={(id) => window.open(`/admin/bookings/${id}`, "_self")}
				/>
			)}

			{actionDialogState && (
				<AdminBookingActionDialog
					action={actionDialogState.action}
					bookingId={actionDialogState.bookingId}
					onClose={() => setActionDialogState(null)}
				/>
			)}
		</div>
	);
}
