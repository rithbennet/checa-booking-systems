"use client";

import { useEffect, useRef, useState } from "react";
import type { FiltersState } from "../model/filters.schema";

export function useBulkSelection(params: FiltersState) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset selection when filters change (not just page navigation)
  const prevFiltersRef = useRef({
    status: params.status,
    type: params.type,
    q: params.q,
  });

  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (
      prev.status !== params.status ||
      prev.type !== params.type ||
      prev.q !== params.q
    ) {
      setSelectedIds(new Set());
      prevFiltersRef.current = {
        status: params.status,
        type: params.type,
        q: params.q,
      };
    }
  }, [params.status, params.type, params.q]);

  const handleSelectAll = (draftIds: string[]) => {
    setSelectedIds(new Set(draftIds));
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  return {
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    clearSelection,
  };
}
