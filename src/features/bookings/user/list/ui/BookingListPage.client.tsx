"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { bookingsListKeys } from "@/entities/booking/api";
import { PaginationControls } from "@/shared/ui/PaginationControls";
import RouterButton from "@/shared/ui/router-button";
import { SearchBar } from "@/shared/ui/SearchBar";
import { useBookingDeletion } from "../lib/useBookingDeletion";
import { useBulkSelection } from "../lib/useBulkSelection";
import { useListData } from "../lib/useListData";
import { useListParams } from "../lib/useListParams";
import { canSeeAmount } from "../model/list.permissions";
import { toRow } from "../model/list.selectors";
import { ActionBar } from "./ActionBar";
import { BookingsTable } from "./BookingsTable";
import { BulkActionsToolbar } from "./BulkActionsToolbar";
import { StatusChips } from "./StatusChips";
import { TypeFilter } from "./TypeFilter";

export function BookingListPageClient({
	userStatus,
}: {
	userStatus: string | null;
}) {
	const queryClient = useQueryClient();
	const { params, setParams, qInput, setQInput } = useListParams();
	const { items, total, isLoading, counts, isFetching } = useListData(params);

	// Business logic hooks
	const { handleDelete, handleBulkDelete, isBulkDeleting } =
		useBookingDeletion();
	const { selectedIds, handleSelectAll, handleSelectRow, clearSelection } =
		useBulkSelection(params);

	// Prefetch counts for all type filters on mount
	useEffect(() => {
		const typesToPrefetch: Array<"all" | "analysis_only" | "working_space"> = [
			"all",
			"analysis_only",
			"working_space",
		];

		typesToPrefetch.forEach((type) => {
			if (type !== params.type) {
				const countParams = {
					createdFrom: params.createdFrom,
					createdTo: params.createdTo,
					type,
				};
				queryClient.prefetchQuery({
					queryKey: bookingsListKeys.counts(countParams),
					queryFn: async () => {
						const sp = new URLSearchParams();
						if (countParams.createdFrom)
							sp.set("createdFrom", countParams.createdFrom);
						if (countParams.createdTo)
							sp.set("createdTo", countParams.createdTo);
						if (countParams.type) sp.set("type", countParams.type);
						const res = await fetch(
							`/api/bookings/status-counts?${sp.toString()}`,
						);
						if (!res.ok) throw new Error("Failed to fetch counts");
						return res.json();
					},
				});
			}
		});
	}, [queryClient, params.createdFrom, params.createdTo, params.type]);

	const showAmount = canSeeAmount(userStatus);
	const rows = useMemo(
		() => items.map((i) => toRow(i, showAmount)),
		[items, showAmount],
	);

	const handleRefresh = () => {
		queryClient.invalidateQueries({ queryKey: bookingsListKeys.root });
		queryClient.invalidateQueries({ queryKey: bookingsListKeys.countsRoot });
		toast.success("Refreshing", {
			description: "Fetching latest booking data...",
		});
	};

	const onBulkDelete = async () => {
		const idsToDelete = Array.from(selectedIds);
		await handleBulkDelete(idsToDelete);
		clearSelection();
	};

	const onSelectAll = (checked: boolean, draftIds: string[]) => {
		if (checked) {
			handleSelectAll(draftIds);
		} else {
			clearSelection();
		}
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-6">
				<h1 className="font-bold text-3xl">My Bookings</h1>
				<p className="mt-2 text-gray-600">
					View and manage your lab service bookings
				</p>
			</div>

			{/* Filters Section */}
			<div className="mb-6 space-y-4">
				{/* Row 1: Search and Actions */}
				<div className="flex items-center gap-3">
					<SearchBar
						autoFocus
						onChange={setQInput}
						placeholder="Search by reference or project title..."
						value={qInput}
					/>
					<ActionBar
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
					<StatusChips
						active={params.status}
						counts={counts}
						onChange={(next) => setParams({ status: next })}
					/>
				</div>

				{/* Row 3: Type Filter + New Booking */}
				<div className="flex items-center justify-between gap-3">
					<TypeFilter
						onChange={(v) => setParams({ type: v })}
						value={params.type}
					/>
					<RouterButton href="/bookings/new">New Booking</RouterButton>
				</div>

				{/* Search results message */}
				{qInput && (
					<div className="text-muted-foreground text-sm">
						Showing {total} result{total !== 1 ? "s" : ""} for "{qInput}"
					</div>
				)}
			</div>

			{/* Bulk Actions Toolbar */}
			<BulkActionsToolbar
				isDeleting={isBulkDeleting}
				onClearSelection={clearSelection}
				onDelete={onBulkDelete}
				selectedCount={selectedIds.size}
			/>

			{/* Table */}
			<BookingsTable
				isLoading={isLoading}
				onDelete={handleDelete}
				onSelectAll={onSelectAll}
				onSelectRow={handleSelectRow}
				rows={rows}
				selectedIds={selectedIds}
			/>

			{/* Pagination */}
			<PaginationControls
				currentPage={params.page}
				isLoading={isLoading}
				onPageChange={(page) => setParams({ page }, { preservePage: true })}
				onPageSizeChange={(pageSize) => setParams({ pageSize })}
				pageSize={params.pageSize}
				params={params}
				rowsCount={rows.length}
				total={total}
			/>
		</div>
	);
}
