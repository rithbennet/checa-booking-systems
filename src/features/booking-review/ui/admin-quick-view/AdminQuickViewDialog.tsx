"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useAdminBookingDetail } from "@/entities/booking/api/useAdminBookingDetail";
import { useAdminBookingAction } from "@/features/booking-review/lib/useAdminBookingList";
import { Dialog, DialogContent } from "@/shared/ui/shadcn/dialog";
import { AdminQuickViewConfirmDialog } from "./AdminQuickViewConfirmDialog";
import { AdminQuickViewDialogActions } from "./AdminQuickViewDialogActions";
import { AdminQuickViewDialogContent } from "./AdminQuickViewDialogContent";
import { AdminQuickViewDialogHeader } from "./AdminQuickViewDialogHeader";
import { AdminQuickViewDialogSkeleton } from "./AdminQuickViewDialogSkeleton";

interface AdminQuickViewDialogProps {
    bookingId: string;
    onClose: () => void;
    onOpenFullPage: (id: string) => void;
}

export function AdminQuickViewDialog({
    bookingId,
    onClose,
    onOpenFullPage,
}: AdminQuickViewDialogProps) {
    const queryClient = useQueryClient();
    const [showAllServices, setShowAllServices] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [pendingAction, setPendingAction] = useState<
        "approve" | "reject" | "request_revision" | null
    >(null);
    const [comment, setComment] = useState("");
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const { data: booking, isLoading } = useAdminBookingDetail(bookingId);
    const mutation = useAdminBookingAction();

    const handleActionClick = (
        action: "approve" | "reject" | "request_revision",
    ) => {
        if (action === "approve") {
            setPendingAction(action);
            setShowConfirmDialog(true);
        } else {
            if (pendingAction === action) {
                setShowConfirmDialog(true);
            } else {
                setPendingAction(action);
                setComment("");
            }
        }
    };

    const handleConfirmAction = async () => {
        if (!pendingAction) return;

        try {
            await mutation.mutateAsync({
                id: bookingId,
                action: pendingAction,
                comment: comment.trim() || undefined,
            });

            toast.success(
                {
                    approve: "Booking approved successfully",
                    reject: "Booking rejected",
                    request_revision: "Revision request sent",
                }[pendingAction],
            );

            queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });

            if (pendingAction === "approve") {
                setTimeout(onClose, 700);
            }

            setPendingAction(null);
            setShowConfirmDialog(false);
            setComment("");
        } catch {
            toast.error("Action failed");
        }
    };

    if (isLoading || !booking) {
        return (
            <Dialog onOpenChange={onClose} open>
                <AdminQuickViewDialogSkeleton onClose={onClose} />
            </Dialog>
        );
    }

    return (
        <>
            <Dialog onOpenChange={onClose} open>
                <DialogContent
                    className="max-h-[95vh] max-w-3xl overflow-y-auto rounded-xl p-6"
                    showCloseButton={false}
                >
                    <AdminQuickViewDialogHeader
                        booking={booking}
                        onClose={onClose}
                        onOpenFullPage={onOpenFullPage}
                    />

                    <AdminQuickViewDialogContent
                        booking={booking}
                        comment={comment}
                        onCommentChange={setComment}
                        onToggleDescription={() =>
                            setShowFullDescription(!showFullDescription)
                        }
                        onToggleServices={() => setShowAllServices(!showAllServices)}
                        pendingAction={pendingAction}
                        showAllServices={showAllServices}
                        showFullDescription={showFullDescription}
                    />

                    <AdminQuickViewDialogActions
                        booking={booking}
                        mutation={mutation}
                        onActionClick={handleActionClick}
                        pendingAction={pendingAction}
                    />
                </DialogContent>
            </Dialog>

            <AdminQuickViewConfirmDialog
                mutation={mutation}
                onCancel={() => {
                    setShowConfirmDialog(false);
                    setPendingAction(null);
                    setComment("");
                }}
                onConfirm={handleConfirmAction}
                pendingAction={pendingAction}
                showConfirmDialog={showConfirmDialog}
            />
        </>
    );
}
