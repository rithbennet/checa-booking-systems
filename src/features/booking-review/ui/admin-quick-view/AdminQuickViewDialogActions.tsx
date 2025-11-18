"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import type { BookingDetailVM } from "@/entities/booking/model/types";
import { Button } from "@/shared/ui/shadcn/button";
import { canPerformAction } from "../../model/admin-list.utils";

type MutationParams = {
    id: string;
    action: "approve" | "reject" | "request_revision";
    comment?: string;
};

interface AdminQuickViewDialogActionsProps {
    booking: BookingDetailVM;
    pendingAction: "approve" | "reject" | "request_revision" | null;
    mutation: UseMutationResult<unknown, unknown, MutationParams, unknown>;
    onActionClick: (action: "approve" | "reject" | "request_revision") => void;
}

export function AdminQuickViewDialogActions({
    booking,
    pendingAction,
    mutation,
    onActionClick,
}: AdminQuickViewDialogActionsProps) {
    const canApprove = canPerformAction(booking.status, "approve");
    const canReject = canPerformAction(booking.status, "reject");
    const canRequestRevision = canPerformAction(
        booking.status,
        "requestRevision",
    );

    return (
        <div className="sticky bottom-0 mt-4 flex justify-end gap-2 border-t bg-background pt-3">
            {canReject && (
                <Button
                    disabled={mutation.isPending}
                    onClick={() => onActionClick("reject")}
                    variant="destructive"
                >
                    {pendingAction === "reject" ? "Confirm Reject" : "Reject"}
                </Button>
            )}

            {canRequestRevision && (
                <Button
                    disabled={mutation.isPending}
                    onClick={() => onActionClick("request_revision")}
                    variant="outline"
                >
                    {pendingAction === "request_revision"
                        ? "Confirm Request"
                        : "Request Revision"}
                </Button>
            )}

            {canApprove && (
                <Button
                    disabled={mutation.isPending}
                    onClick={() => onActionClick("approve")}
                >
                    Approve
                </Button>
            )}
        </div>
    );
}
