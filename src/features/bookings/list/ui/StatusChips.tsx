"use client";

import { Badge } from "@/shared/ui/shadcn/badge";

type Counts = {
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

export function StatusChips({
    counts,
    active,
    onChange,
}: {
    counts?: Counts;
    active: string[] | undefined;
    onChange: (next: string[] | undefined) => void;
}) {
    // Single-select grouping behavior to keep URL clean
    const isAll = !active || active.length === 0;
    const isDraft = active?.length === 1 && active[0] === "draft";
    const isPending =
        Array.isArray(active) &&
        active.length === 2 &&
        active.includes("pending_user_verification") &&
        active.includes("pending_approval");
    const isApproved = active?.length === 1 && active[0] === "approved";
    const isInProgress = active?.length === 1 && active[0] === "in_progress";
    const isCompleted = active?.length === 1 && active[0] === "completed";
    const isRejected = active?.length === 1 && active[0] === "rejected";
    const isCancelled = active?.length === 1 && active[0] === "cancelled";

    const pendingCount = counts
        ? counts.pending_user_verification + counts.pending_approval
        : undefined;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Badge
                className={isAll ? "ring-2 ring-primary" : "cursor-pointer"}
                onClick={() => onChange(undefined)}
                variant="secondary"
            >
                All {counts ? `(${counts.all})` : ""}
            </Badge>
            <Badge
                className={isDraft ? "ring-2 ring-primary" : "cursor-pointer"}
                onClick={() => onChange(["draft"])}
                variant="secondary"
            >
                Draft {counts ? `(${counts.draft})` : ""}
            </Badge>
            <Badge
                className={isPending ? "ring-2 ring-primary" : "cursor-pointer"}
                onClick={() => onChange(["pending_user_verification", "pending_approval"])}
                variant="secondary"
            >
                Pending {pendingCount !== undefined ? `(${pendingCount})` : ""}
            </Badge>
            <Badge
                className={isApproved ? "ring-2 ring-primary" : "cursor-pointer"}
                onClick={() => onChange(["approved"])}
                variant="secondary"
            >
                Approved {counts ? `(${counts.approved})` : ""}
            </Badge>
            <Badge
                className={isInProgress ? "ring-2 ring-primary" : "cursor-pointer"}
                onClick={() => onChange(["in_progress"])}
                variant="secondary"
            >
                In progress {counts ? `(${counts.in_progress})` : ""}
            </Badge>
            <Badge
                className={isCompleted ? "ring-2 ring-primary" : "cursor-pointer"}
                onClick={() => onChange(["completed"])}
                variant="secondary"
            >
                Completed {counts ? `(${counts.completed})` : ""}
            </Badge>
            <Badge
                className={isRejected ? "ring-2 ring-primary" : "cursor-pointer"}
                onClick={() => onChange(["rejected"])}
                variant="secondary"
            >
                Rejected {counts ? `(${counts.rejected})` : ""}
            </Badge>
            <Badge
                className={isCancelled ? "ring-2 ring-primary" : "cursor-pointer"}
                onClick={() => onChange(["cancelled"])}
                variant="secondary"
            >
                Cancelled {counts ? `(${counts.cancelled})` : ""}
            </Badge>
        </div>
    );
}
