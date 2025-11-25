"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
	UserListFilters,
	UserSortKey,
	UserStatus,
	UserType,
} from "@/entities/user/model/types";
import { useDebounce } from "@/shared/hooks/use-debounce";

const DEFAULT_PAGE_SIZE = 25;

export function useUserListParams() {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Parse current params from URL
	const params: UserListFilters = useMemo(() => {
		const page = Math.max(
			1,
			Number.parseInt(searchParams.get("page") ?? "1", 10),
		);
		const pageSize = Number.parseInt(
			searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE),
			10,
		);
		const sort = (searchParams.get("sort") ?? "created_newest") as UserSortKey;
		const query = searchParams.get("q") ?? undefined;
		const statusParam = searchParams.get("status");
		const status = statusParam ? (statusParam as UserStatus) : undefined;
		const userType = (searchParams.get("userType") ?? "all") as
			| UserType
			| "all";
		return {
			page,
			pageSize: [10, 25, 50].includes(pageSize)
				? (pageSize as 10 | 25 | 50)
				: 25,
			sort,
			query,
			status,
			userType,
		};
	}, [searchParams]);

	// Local search input state (for debouncing)
	const [searchInput, setSearchInput] = useState(params.query ?? "");
	const debouncedSearch = useDebounce(searchInput, 300);

	// Track if this is the initial mount to avoid unnecessary URL updates
	const isInitialMount = useRef(true);

	// Update URL params
	const setParams = useCallback(
		(
			updates: Partial<UserListFilters>,
			options?: { preservePage?: boolean },
		) => {
			const newParams = new URLSearchParams(searchParams.toString());

			// Reset to page 1 unless preservePage is true
			if (!options?.preservePage) {
				newParams.set("page", "1");
			}

			// Apply updates
			for (const [key, value] of Object.entries(updates)) {
				if (value === undefined || value === "" || value === "all") {
					newParams.delete(key === "query" ? "q" : key);
				} else {
					newParams.set(key === "query" ? "q" : key, String(value));
				}
			}

			router.push(`?${newParams.toString()}`, { scroll: false });
		},
		[router, searchParams],
	);

	// Sync debounced search with URL using useEffect (not useMemo!)
	useEffect(() => {
		// Skip initial mount to avoid unnecessary URL update
		if (isInitialMount.current) {
			isInitialMount.current = false;
			return;
		}

		// Only update if the debounced value differs from current URL param
		if (debouncedSearch !== (params.query ?? "")) {
			setParams({ query: debouncedSearch || undefined });
		}
	}, [debouncedSearch, params.query, setParams]);

	return {
		params,
		setParams,
		searchInput,
		setSearchInput,
	};
}
