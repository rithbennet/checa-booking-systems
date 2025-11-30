"use client";

import { AlertCircle, FileText, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useUserSampleResults } from "@/entities/sample-tracking";
import type { SampleStatus } from "@/entities/sample-tracking/model/types";
import { getUserResultsColumns } from "@/features/user-results";
import {
	DataTable,
	DataTableStatusChips,
	DataTableToolbar,
	type FilterDef,
	STATUS_CHIP_COLORS,
	type StatusChipOption,
} from "@/shared/ui/table";

export default function ResultsPage() {
	const { data, isLoading, error } = useUserSampleResults();

	// Filter states
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<SampleStatus | undefined>(
		undefined,
	);
	const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

	const columns = useMemo(() => getUserResultsColumns(), []);

	// Calculate counts for status chips
	const statusCounts = useMemo(() => {
		if (!data?.items)
			return {
				all: 0,
				pending: 0,
				received: 0,
				in_analysis: 0,
				analysis_complete: 0,
			};
		return {
			all: data.items.length,
			pending: data.items.filter((i) => i.status === "pending").length,
			received: data.items.filter((i) => i.status === "received").length,
			in_analysis: data.items.filter((i) => i.status === "in_analysis").length,
			analysis_complete: data.items.filter(
				(i) => i.status === "analysis_complete",
			).length,
		};
	}, [data?.items]);

	// Status chip options
	const statusChipOptions: StatusChipOption<SampleStatus | undefined>[] = [
		{
			value: undefined,
			label: "All",
			count: statusCounts.all,
			activeClassName: STATUS_CHIP_COLORS.all,
		},
		{
			value: "pending",
			label: "Pending",
			count: statusCounts.pending,
			activeClassName: STATUS_CHIP_COLORS.pending,
		},
		{
			value: "received",
			label: "Received",
			count: statusCounts.received,
			activeClassName: STATUS_CHIP_COLORS.processing,
		},
		{
			value: "in_analysis",
			label: "In Analysis",
			count: statusCounts.in_analysis,
			activeClassName: STATUS_CHIP_COLORS.in_progress,
		},
		{
			value: "analysis_complete",
			label: "Complete",
			count: statusCounts.analysis_complete,
			activeClassName: STATUS_CHIP_COLORS.completed,
		},
	];

	// Sort filter options
	const sortFilters: FilterDef[] = [
		{
			id: "sort",
			label: "Sort",
			type: "select",
			options: [
				{ value: "newest", label: "Newest first" },
				{ value: "oldest", label: "Oldest first" },
			],
			value: sortOrder,
			onChange: (value) =>
				setSortOrder((value as "newest" | "oldest") ?? "newest"),
			className: "w-[150px]",
		},
	];

	// Filter and sort data client-side
	const filteredItems = useMemo(() => {
		if (!data?.items) return [];
		let filtered = [...data.items];

		// Apply status filter
		if (statusFilter) {
			filtered = filtered.filter((item) => item.status === statusFilter);
		}

		// Apply search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(item) =>
					item.sampleIdentifier.toLowerCase().includes(query) ||
					item.serviceName.toLowerCase().includes(query) ||
					item.bookingRef.toLowerCase().includes(query),
			);
		}

		// Apply sort (by updatedAt for activity-based sorting)
		filtered.sort((a, b) => {
			const dateA = new Date(a.updatedAt).getTime();
			const dateB = new Date(b.updatedAt).getTime();
			return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
		});

		return filtered;
	}, [data?.items, statusFilter, searchQuery, sortOrder]);

	if (isLoading) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="flex min-h-[400px] flex-col items-center justify-center gap-2 text-muted-foreground">
				<AlertCircle className="size-8" />
				<p>Failed to load results data. Please try again.</p>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			{/* Page Header */}
			<div>
				<h1 className="font-bold text-2xl text-slate-900">My Results</h1>
				<p className="text-muted-foreground text-sm">
					View and download your analysis results
				</p>
			</div>

			{/* Results Table */}
			<div className="space-y-4">
				{/* Toolbar with search and filters */}
				<DataTableToolbar
					filters={sortFilters}
					onSearchChange={setSearchQuery}
					searchPlaceholder="Search by sample ID, service, or booking ref..."
					searchValue={searchQuery}
				>
					<DataTableStatusChips
						active={statusFilter}
						label="Status:"
						onChange={setStatusFilter}
						options={statusChipOptions}
					/>
				</DataTableToolbar>

				<DataTable
					columns={columns}
					data={filteredItems}
					emptyMessage="No sample results found"
					emptyState={
						searchQuery || statusFilter ? (
							<div className="flex flex-col items-center gap-2 py-8 text-center">
								<FileText className="size-12 text-muted-foreground/50" />
								<p className="text-muted-foreground">
									No results match your filters.
								</p>
								<p className="text-muted-foreground text-sm">
									Try adjusting your search or filter criteria.
								</p>
							</div>
						) : (
							<div className="flex flex-col items-center gap-2 py-8 text-center">
								<FileText className="size-12 text-muted-foreground/50" />
								<p className="text-muted-foreground">
									You don't have any sample results yet.
								</p>
								<p className="text-muted-foreground text-sm">
									Results will appear here once your samples have been
									processed.
								</p>
							</div>
						)
					}
					getRowId={(row) => row.id}
					isLoading={false}
				/>
			</div>
		</div>
	);
}
