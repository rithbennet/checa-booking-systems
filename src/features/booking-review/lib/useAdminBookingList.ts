/**
 * Admin Booking List React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AdminBookingListFilters,
  AdminBookingRowVM,
  AdminStatusCounts,
  BulkActionResult,
} from "../model/admin-list.types";
import { formatSortForAPI } from "../model/admin-list.utils";

const ADMIN_BOOKING_KEYS = {
  root: ["admin", "bookings"] as const,
  countsRoot: ["admin", "bookings", "counts"] as const,
  list: (filters: Partial<AdminBookingListFilters>) =>
    [...ADMIN_BOOKING_KEYS.root, "list", filters] as const,
  counts: () => [...ADMIN_BOOKING_KEYS.countsRoot] as const,
  detail: (id: string) => [...ADMIN_BOOKING_KEYS.root, "detail", id] as const,
};
type ListResponse = {
  items: AdminBookingRowVM[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/**
 * Hook to fetch admin booking list with filters
 */
export function useAdminBookingList(filters: Partial<AdminBookingListFilters>) {
  return useQuery({
    queryKey: ADMIN_BOOKING_KEYS.list(filters),
    queryFn: async (): Promise<ListResponse> => {
      const sortParams = formatSortForAPI(filters.sort ?? "updated_newest");
      const searchParams = new URLSearchParams({
        page: String(filters.page ?? 1),
        pageSize: String(filters.pageSize ?? 25),
        sortField: sortParams.field,
        sortDirection: sortParams.direction,
        ...(filters.query ? { query: filters.query } : {}),
        ...(filters.status?.length ? { status: filters.status.join(",") } : {}),
        ...(filters.type && filters.type !== "all"
          ? { type: filters.type }
          : {}),
      });

      const res = await fetch(`/api/admin/bookings?${searchParams}`);
      if (!res.ok) {
        throw new Error("Failed to load bookings");
      }
      return res.json();
    },
    staleTime: 10_000,
  });
}

/**
 * Hook to fetch status counts for admin chips
 */
export function useAdminBookingCounts() {
  return useQuery({
    queryKey: ADMIN_BOOKING_KEYS.counts(),
    queryFn: async (): Promise<AdminStatusCounts> => {
      const res = await fetch("/api/admin/bookings/counts");
      if (!res.ok) {
        throw new Error("Failed to load counts");
      }
      return res.json();
    },
    staleTime: 30_000,
  });
}

/**
 * Hook to perform single booking action (approve, reject, request_revision)
 */
export function useAdminBookingAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      action,
      comment,
    }: {
      id: string;
      action: "approve" | "reject" | "request_revision";
      comment?: string;
    }) => {
      const res = await fetch(`/api/admin/bookings/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error ?? "Action failed");
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate list and counts
      queryClient.invalidateQueries({ queryKey: ADMIN_BOOKING_KEYS.root });
      queryClient.invalidateQueries({
        queryKey: ADMIN_BOOKING_KEYS.countsRoot,
      });
    },
  });
}

/**
 * Hook to perform bulk action on multiple bookings
 */
export function useAdminBulkAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ids,
      action,
      comment,
    }: {
      ids: string[];
      action: "approve" | "reject" | "request_revision" | "delete";
      comment?: string;
    }): Promise<BulkActionResult> => {
      const res = await fetch("/api/admin/bookings/bulk-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action, comment }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error ?? "Bulk action failed");
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate list and counts
      queryClient.invalidateQueries({ queryKey: ADMIN_BOOKING_KEYS.root });
      queryClient.invalidateQueries({
        queryKey: ADMIN_BOOKING_KEYS.countsRoot,
      });
    },
  });
}

/**
 * Hook to delete a single booking
 */
export function useDeleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error ?? "Delete failed");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_BOOKING_KEYS.root });
      queryClient.invalidateQueries({
        queryKey: ADMIN_BOOKING_KEYS.countsRoot,
      });
    },
  });
}
