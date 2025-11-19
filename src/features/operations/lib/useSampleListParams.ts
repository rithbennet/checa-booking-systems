"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/shared/hooks/use-debounce";
import type { SampleFiltersState } from "../model/sample-filters.schema";

function fromSearchParams(searchParams: URLSearchParams): SampleFiltersState {
	const statusAll = searchParams.getAll("status");
	return {
		page: Number.parseInt(searchParams.get("page") ?? "1", 10) || 1,
		pageSize: Number.parseInt(searchParams.get("pageSize") ?? "25", 10) || 25,
		q: searchParams.get("q") ?? "",
		status: statusAll.length > 0 ? statusAll : [],
	};
}

function buildHref(pathname: string, params: SampleFiltersState): string {
	const sp = new URLSearchParams();
	if (params.page > 1) sp.set("page", String(params.page));
	if (params.pageSize !== 25) sp.set("pageSize", String(params.pageSize));
	if (params.q) sp.set("q", params.q);
	if (params.status && params.status.length > 0) {
		for (const s of params.status) {
			sp.append("status", s);
		}
	}
	const qs = sp.toString();
	return qs ? `${pathname}?${qs}` : pathname;
}

export function useSampleListParams() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const parsed = useMemo(() => {
		return fromSearchParams(new URLSearchParams(searchParams?.toString()));
	}, [searchParams]);

	const [qInput, setQInput] = useState(parsed.q ?? "");
	const debouncedQInput = useDebounce(qInput, 350);

	useEffect(() => {
		setQInput(parsed.q ?? "");
	}, [parsed.q]);

	const setParams = useCallback(
		(next: Partial<SampleFiltersState>, opts?: { preservePage?: boolean }) => {
			const onlyPageChange =
				"page" in next &&
				Object.keys(next).length === 1 &&
				typeof next.page === "number";
			const nextState: SampleFiltersState = {
				...parsed,
				...next,
				page:
					onlyPageChange || opts?.preservePage ? (next.page ?? parsed.page) : 1,
			};
			const href = buildHref(pathname, nextState);
			router.replace(href, { scroll: false });
		},
		[parsed, pathname, router],
	);

	useEffect(() => {
		const currentUrlQ = parsed.q ?? "";
		if (debouncedQInput !== currentUrlQ) {
			setParams({ q: debouncedQInput || undefined }, { preservePage: false });
		}
	}, [debouncedQInput, parsed.q, setParams]);

	return { params: parsed, setParams, qInput, setQInput };
}
