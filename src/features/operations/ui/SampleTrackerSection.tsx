"use client";

import { useMemo } from "react";
import { useSampleOperationsList } from "@/entities/sample-tracking/model/queries";
import { PaginationControls } from "@/shared/ui/PaginationControls";
import { SearchBar } from "@/shared/ui/SearchBar";
import { useSampleListParams } from "../lib/useSampleListParams";
import { SampleStatusChips } from "./SampleStatusChips";
import { SamplesTable } from "./SamplesTable";

export function SampleTrackerSection() {
	const { params, setParams, qInput, setQInput } = useSampleListParams();
	const { data, isLoading, isFetching } = useSampleOperationsList({
		status: params.status.length > 0 ? params.status : undefined,
		q: params.q || undefined,
		page: params.page,
		pageSize: params.pageSize,
	});

	const rows = useMemo(() => data?.items ?? [], [data?.items]);
	const total = data?.total ?? 0;
	const totalPages = data?.totalPages ?? 0;

	const handleStatusChange = (_sampleId: string, _status: string) => {
		// Status change handled by StatusCell mutation
		// This is just a placeholder for the table prop
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="font-bold text-2xl text-gray-900">Sample Tracker</h2>
				<p className="mt-1 text-gray-600 text-sm">
					Track and update sample statuses across all bookings
				</p>
			</div>

			{/* Filters */}
			<div className="space-y-4">
				<SearchBar
					onChange={setQInput}
					placeholder="Search by sample ID, customer name, or service..."
					value={qInput}
				/>
				<SampleStatusChips
					active={params.status.length > 0 ? params.status : undefined}
					onChange={(next) => setParams({ status: next })}
				/>
			</div>

			{/* Table */}
			<SamplesTable
				isLoading={isLoading || isFetching}
				onStatusChange={handleStatusChange}
				rows={rows}
			/>

			{/* Pagination */}
			{totalPages > 1 && (
				<PaginationControls
					currentPage={params.page}
					isLoading={isLoading || isFetching}
					onPageChange={(page) => setParams({ page })}
					onPageSizeChange={(pageSize) => setParams({ pageSize })}
					pageSize={params.pageSize}
					params={{}}
					rowsCount={rows.length}
					total={total}
				/>
			)}
		</div>
	);
}
