"use client";

import {
  useBookingStatusCounts,
  useBookingsList,
} from "@/entities/booking/api";
import type { FiltersState } from "../model/filters.schema";

export function useListData(params: FiltersState) {
  const { data, isLoading, isError, isFetching } = useBookingsList({
    page: params.page,
    pageSize: params.pageSize,
    sort: params.sort,
    q: params.q,
    status: params.status,
    createdFrom: params.createdFrom,
    createdTo: params.createdTo,
    type: params.type,
  });

  const countsQuery = useBookingStatusCounts({
    status: params.status,
    createdFrom: params.createdFrom,
    createdTo: params.createdTo,
    type: params.type,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return {
    items,
    total,
    isLoading,
    isError,
    isFetching,
    counts: countsQuery.data,
    isCountsLoading: countsQuery.isLoading,
  };
}
