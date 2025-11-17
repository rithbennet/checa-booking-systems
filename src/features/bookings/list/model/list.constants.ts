export const DEFAULT_PAGE_SIZE = 25;
export const DEFAULT_SORT: "updated_at:desc" = "updated_at:desc";

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_user_verification: "Pending Verification",
  pending_approval: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};
