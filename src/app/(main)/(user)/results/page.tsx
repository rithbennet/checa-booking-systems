"use client";

import { AlertCircle, FileText, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useUserSampleResults } from "@/entities/sample-tracking";
import { getUserResultsColumns } from "@/features/user-results";
import { DataTable } from "@/shared/ui/table";

export default function ResultsPage() {
	const { data, isLoading, error } = useUserSampleResults();

	const columns = useMemo(() => getUserResultsColumns(), []);

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

	const { items } = data;

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
				<DataTable
					columns={columns}
					data={items}
					emptyMessage="No sample results found"
					emptyState={
						<div className="flex flex-col items-center gap-2 py-8 text-center">
							<FileText className="size-12 text-muted-foreground/50" />
							<p className="text-muted-foreground">
								You don't have any sample results yet.
							</p>
							<p className="text-muted-foreground text-sm">
								Results will appear here once your samples have been processed.
							</p>
						</div>
					}
					getRowId={(row) => row.id}
					isLoading={false}
				/>
			</div>
		</div>
	);
}
