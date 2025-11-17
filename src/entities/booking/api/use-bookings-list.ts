import { useQuery } from "@tanstack/react-query";

export type SortKey =
  | "updated_at:desc"
  | "updated_at:asc"
  | "created_at:desc"
  | "created_at:asc"
  | "status:asc"
  | "amount:desc"
  | "amount:asc";

export type BookingListItem = {
  id: string;
  reference: string;
  projectTitle: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  flags: {
    hasWorkingSpace: boolean;
    hasUnread: boolean;
    hasOverdueInvoice: boolean;
  };
  nextRequiredAction?: string;
};

export type UseBookingsListParams = {
  page?: number;
  pageSize?: number;
  sort?: SortKey;
  q?: string;
  status?: string[];
  createdFrom?: string;
  createdTo?: string;
  type?: "all" | "analysis_only" | "working_space";
};

async function fetchBookingsList(params: UseBookingsListParams) {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));
  if (params.sort) sp.set("sort", params.sort);
  if (params.q) sp.set("q", params.q);
  if (params.createdFrom) sp.set("createdFrom", params.createdFrom);
  if (params.createdTo) sp.set("createdTo", params.createdTo);
  if (params.type) sp.set("type", params.type);
  if (params.status && params.status.length > 0) {
    for (const s of params.status) sp.append("status", s);
  }
  const res = await fetch(`/api/bookings?${sp.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch bookings");
  }
  return (await res.json()) as { items: BookingListItem[]; total: number };
}

async function fetchStatusCounts(
  params: Omit<UseBookingsListParams, "page" | "pageSize" | "sort" | "q">
) {
  const sp = new URLSearchParams();
  if (params.createdFrom) sp.set("createdFrom", params.createdFrom);
  if (params.createdTo) sp.set("createdTo", params.createdTo);
  if (params.type) sp.set("type", params.type);
  // Intentionally exclude current status[] from counts to avoid refetch on chip click
  const res = await fetch(`/api/bookings/status-counts?${sp.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch counts");
  }
  return (await res.json()) as {
    all: number;
    draft: number;
    pending_user_verification: number;
    pending_approval: number;
    approved: number;
    rejected: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
}

function stableSerialize(obj: Record<string, unknown>): string {
  const entries = Object.entries(obj).filter(
    ([, v]) => v !== undefined && v !== null
  );
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return JSON.stringify(Object.fromEntries(entries));
}

export const bookingsListKeys = {
  root: ["bookings-list"] as const,
  countsRoot: ["bookings-counts"] as const,
  list: (p: UseBookingsListParams) =>
    [
      "bookings-list",
      stableSerialize({
        page: p.page,
        pageSize: p.pageSize,
        sort: p.sort,
        q: p.q,
        status: p.status?.join("|"),
        createdFrom: p.createdFrom,
        createdTo: p.createdTo,
        type: p.type,
      }),
    ] as const,
  counts: (
    p: Omit<UseBookingsListParams, "page" | "pageSize" | "sort" | "q">
  ) =>
    [
      "bookings-counts",
      stableSerialize({
        createdFrom: p.createdFrom,
        createdTo: p.createdTo,
        type: p.type,
      }),
    ] as const,
};

export function useBookingsList(params: UseBookingsListParams) {
  return useQuery({
    queryKey: bookingsListKeys.list(params),
    queryFn: () => fetchBookingsList(params),
    keepPreviousData: true,
  });
}

export function useBookingStatusCounts(
  params: Omit<UseBookingsListParams, "page" | "pageSize" | "sort" | "q">
) {
  return useQuery({
    queryKey: bookingsListKeys.counts(params),
    queryFn: () => fetchStatusCounts(params),
    staleTime: 5 * 60_000, // 5 minutes - longer cache
    cacheTime: 10 * 60_000, // 10 minutes - keep in cache even when unused
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch if data exists
    keepPreviousData: true, // Prevent flash of empty state
  });
}
