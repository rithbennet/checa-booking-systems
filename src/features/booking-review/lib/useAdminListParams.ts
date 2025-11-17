"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/shared/hooks/use-debounce";
import {
  ADMIN_DEFAULT_PAGE_SIZE,
  ADMIN_DEFAULT_SORT,
} from "../model/admin-list.constants";
import type { AdminBookingListFilters } from "../model/admin-list.types";

function fromSearchParams(params: URLSearchParams): AdminBookingListFilters {
  const page = Number.parseInt(params.get("page") ?? "1", 10);
  const pageSize = Number.parseInt(
    params.get("pageSize") ?? String(ADMIN_DEFAULT_PAGE_SIZE),
    10
  ) as 25 | 50 | 100;
  const sort =
    (params.get("sort") as AdminBookingListFilters["sort"]) ??
    ADMIN_DEFAULT_SORT;
  const query = params.get("q") || undefined;
  const statusParam = params.get("status");
  const status = statusParam
    ? (statusParam.split(",") as AdminBookingListFilters["status"])
    : undefined;
  const type = (params.get("type") as AdminBookingListFilters["type"]) ?? "all";

  return {
    page,
    pageSize,
    sort,
    query,
    status,
    type,
  };
}

function buildHref(pathname: string, filters: AdminBookingListFilters): string {
  const params = new URLSearchParams();
  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }
  if (filters.pageSize !== ADMIN_DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(filters.pageSize));
  }
  if (filters.sort !== ADMIN_DEFAULT_SORT) {
    params.set("sort", filters.sort);
  }
  if (filters.query) {
    params.set("q", filters.query);
  }
  if (filters.status && filters.status.length > 0) {
    params.set("status", filters.status.join(","));
  }
  if (filters.type && filters.type !== "all") {
    params.set("type", filters.type);
  }

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function useAdminListParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const parsed = useMemo(() => {
    return fromSearchParams(new URLSearchParams(searchParams?.toString()));
  }, [searchParams]);

  // Local input state for q to avoid URL writes every keystroke
  const [qInput, setQInput] = useState(parsed.query ?? "");
  // Debounce committing search to URL
  const debouncedQInput = useDebounce(qInput, 350);

  // Sync local input when URL changes externally (e.g., back/forward navigation)
  useEffect(() => {
    setQInput(parsed.query ?? "");
  }, [parsed.query]);

  const setParams = useCallback(
    (
      next: Partial<AdminBookingListFilters>,
      opts?: { preservePage?: boolean }
    ) => {
      const onlyPageChange =
        "page" in next &&
        Object.keys(next).length === 1 &&
        typeof next.page === "number";
      const nextState: AdminBookingListFilters = {
        ...parsed,
        ...next,
        page:
          onlyPageChange || opts?.preservePage ? next.page ?? parsed.page : 1,
      };
      const href = buildHref(pathname, nextState);
      router.replace(href, { scroll: false });
    },
    [parsed, pathname, router]
  );

  // Commit debounced q to URL when it differs
  useEffect(() => {
    const currentUrlQ = parsed.query ?? "";
    if (debouncedQInput !== currentUrlQ) {
      setParams(
        { query: debouncedQInput || undefined },
        { preservePage: false }
      );
    }
  }, [debouncedQInput, parsed.query, setParams]);

  return { params: parsed, setParams, qInput, setQInput };
}
