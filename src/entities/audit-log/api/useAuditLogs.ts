import { useQuery } from "@tanstack/react-query";
import type { AuditLogListParams, AuditLogListResponse } from "../model/types";
import { auditLogKeys } from "./query-keys";

const DEFAULT_PAGE_SIZE = 20;

function buildSearchParams(params: AuditLogListParams) {
	const searchParams = new URLSearchParams();
	searchParams.set("page", String(params.page ?? 1));
	searchParams.set("pageSize", String(params.pageSize ?? DEFAULT_PAGE_SIZE));
	if (params.search) {
		searchParams.set("search", params.search);
	}
	return searchParams;
}

async function fetchAuditLogs(
	params: AuditLogListParams,
): Promise<AuditLogListResponse> {
	const searchParams = buildSearchParams(params);
	const res = await fetch(`/api/admin/audit-logs?${searchParams.toString()}`, {
		method: "GET",
		credentials: "same-origin",
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.error || "Failed to fetch audit logs");
	}

	return res.json();
}

export function useAuditLogs(params: AuditLogListParams = {}) {
	const normalizedParams: AuditLogListParams = {
		page: Math.max(1, params.page ?? 1),
		pageSize: Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE),
		search: params.search?.trim() || undefined,
	};

	return useQuery<AuditLogListResponse>({
		queryKey: auditLogKeys.list(normalizedParams),
		queryFn: () => fetchAuditLogs(normalizedParams),
		keepPreviousData: true,
	});
}
