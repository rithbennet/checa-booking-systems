"use client";

import { useState } from "react";
import { useAuditLogs } from "@/entities/audit-log";
import { SystemActivityTable } from "@/features/system-activity";
import { useDebounce } from "@/shared/hooks/use-debounce";

const DEFAULT_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export function SystemActivityDashboard() {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [search, setSearch] = useState("");

	const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);

	const { data, isLoading, isFetching } = useAuditLogs({
		page,
		pageSize,
		search: debouncedSearch || undefined,
	});

	const logs = data?.items ?? [];
	const total = data?.total ?? 0;

	return (
		<SystemActivityTable
			isLoading={isLoading || isFetching}
			logs={logs}
			onPageChange={setPage}
			onPageSizeChange={(size) => {
				setPageSize(size);
				setPage(1);
			}}
			onSearchChange={(value) => {
				setSearch(value);
				setPage(1);
			}}
			page={page}
			pageSize={pageSize}
			search={search}
			total={total}
		/>
	);
}
