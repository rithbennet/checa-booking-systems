"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/shared/hooks/use-debounce";
import type { FiltersState } from "../model/filters.schema";
import { buildHref, fromSearchParams } from "../model/list.routes";

export function useListParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const parsed = useMemo(() => {
    return fromSearchParams(new URLSearchParams(searchParams?.toString()));
  }, [searchParams]);

  // Local input state for q to avoid URL writes every keystroke
  const [qInput, setQInput] = useState(parsed.q ?? "");
  // Debounce committing search to URL
  const debouncedQInput = useDebounce(qInput, 350);

  // Sync local input when URL changes externally (e.g., back/forward navigation)
  // Only sync when URL param changes, not when local input changes
  useEffect(() => {
    setQInput(parsed.q ?? "");
  }, [parsed.q]);

  const setParams = useCallback(
    (next: Partial<FiltersState>, opts?: { preservePage?: boolean }) => {
      const onlyPageChange =
        "page" in next &&
        Object.keys(next).length === 1 &&
        typeof next.page === "number";
      const nextState: FiltersState = {
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
    const currentUrlQ = parsed.q ?? "";
    if (debouncedQInput !== currentUrlQ) {
      // Only set q if it's not empty, or explicitly set to undefined to clear it
      setParams({ q: debouncedQInput || undefined }, { preservePage: false });
    }
  }, [debouncedQInput, parsed.q, setParams]);

  return { params: parsed, setParams, qInput, setQInput };
}
