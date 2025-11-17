"use client";

import { toast } from "sonner";
import {
  useBulkDeleteBookingDrafts,
  useDeleteBookingDraft,
} from "@/entities/booking/api";

export function useBookingDeletion() {
  const deleteMutation = useDeleteBookingDraft();
  const bulkDeleteMutation = useBulkDeleteBookingDrafts();

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this draft booking? This cannot be undone.")) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Draft deleted", {
        description: "The booking draft has been deleted.",
      });
    } catch (error) {
      toast.error("Delete failed", {
        description:
          error instanceof Error ? error.message : "Failed to delete booking",
      });
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (
      !confirm(`Delete ${ids.length} draft booking(s)? This cannot be undone.`)
    )
      return;

    try {
      const result = await bulkDeleteMutation.mutateAsync(ids);
      toast.success("Bulk delete completed", {
        description: `${result.deleted} deleted, ${result.failed} failed`,
      });
    } catch (error) {
      toast.error("Bulk delete failed", {
        description:
          error instanceof Error ? error.message : "Failed to delete bookings",
      });
    }
  };

  return {
    handleDelete,
    handleBulkDelete,
    isDeleting: deleteMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,
  };
}
