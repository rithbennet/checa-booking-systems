"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Loader2,
    MapPin,
    X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { BookingDetailVM } from "@/entities/booking/model/types";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/shared/ui/shadcn/alert-dialog";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import { Separator } from "@/shared/ui/shadcn/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/shadcn/table";
import { Textarea } from "@/shared/ui/shadcn/textarea";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import {
    formatAmount,
    formatDate,
    formatDateTime,
} from "../lib/admin-formatters";
import { useAdminBookingAction } from "../lib/useAdminBookingList";
import {
    canPerformAction,
    getAdminStatusBadgeClassName,
} from "../model/admin-list.utils";

interface AdminQuickViewDialogProps {
    bookingId: string;
    onClose: () => void;
    onOpenFullPage: (id: string) => void;
}

const MAX_VISIBLE_SERVICES = 5;
const MAX_DESCRIPTION_LINES = 3;

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

    const { data: booking, isLoading } = useQuery({
        queryKey: ["admin", "bookings", "detail", bookingId],
        queryFn: async (): Promise<BookingDetailVM> => {
            const res = await fetch(`/api/admin/bookings/${bookingId}`);
            if (!res.ok) throw new Error("Failed to load booking");
            return res.json();
        },
    });

    const mutation = useAdminBookingAction();

    if (isLoading || !booking) {
        return (
            <Dialog onOpenChange={onClose} open>
                <DialogContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="size-8 animate-spin text-muted-foreground" />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    const status = booking.status;
    const serviceItems = booking.serviceItems;
    const visibleServices = showAllServices
        ? serviceItems
        : serviceItems.slice(0, MAX_VISIBLE_SERVICES);
    const hasMoreServices = serviceItems.length > MAX_VISIBLE_SERVICES;

    const orgDisplay = booking.organization
        ? booking.requesterType === "external"
            ? `${booking.organization.company || ""}${booking.organization.branch ? ` • ${booking.organization.branch}` : ""
            }`
            : [
                booking.organization.ikohza,
                booking.organization.faculty,
                booking.organization.department,
            ]
                .filter(Boolean)
                .join(" • ")
        : null;

    const descriptionLines = booking.projectDescription?.split("\n") || [];
    const needsTruncation = descriptionLines.length > MAX_DESCRIPTION_LINES;
    const displayDescription = showFullDescription
        ? booking.projectDescription
        : needsTruncation
            ? descriptionLines.slice(0, MAX_DESCRIPTION_LINES).join("\n")
            : booking.projectDescription;

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

    const canApprove = canPerformAction(status, "approve");
    const canReject = canPerformAction(status, "reject");
    const canRequestRevision = canPerformAction(status, "requestRevision");

    return (
        <>
            <Dialog onOpenChange={onClose} open>
                <DialogContent
                    className="max-h-[95vh] max-w-3xl overflow-y-auto rounded-xl p-6"
                    showCloseButton={false}
                >
                    {/* TOP HEADER */}
                    <div className="mb-3 flex items-start justify-between">
                        <DialogHeader className="space-y-1">
                            <DialogTitle className="font-semibold text-lg">
                                {booking.referenceNumber}
                            </DialogTitle>

                            <DialogDescription className="space-y-1">
                                <div>
                                    <span className="font-medium">Requested by:</span>{" "}
                                    {booking.user.name} • {booking.user.email}
                                </div>
                                {orgDisplay && (
                                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                        <MapPin className="size-3" />
                                        {orgDisplay}
                                    </div>
                                )}
                                <div className="text-muted-foreground text-xs">
                                    Created: {formatDateTime(booking.createdAt)} • Updated:{" "}
                                    {formatDateTime(booking.updatedAt)}
                                </div>
                            </DialogDescription>

                            <div className="pt-1">
                                <Badge className={getAdminStatusBadgeClassName(status)}>
                                    {status.replace(/_/g, " ")}
                                </Badge>
                            </div>
                        </DialogHeader>

                        {/* TOP RIGHT BUTTONS */}
                        {/* TOP RIGHT BUTTONS */}
                        <div className="flex items-center gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        className="h-8 w-8"
                                        onClick={() => onOpenFullPage(bookingId)}
                                        size="icon"
                                        variant="ghost"
                                    >
                                        <ExternalLink className="size-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Open Full Page</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        className="h-8 w-8"
                                        onClick={onClose}
                                        size="icon"
                                        variant="ghost"
                                    >
                                        <X className="size-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Close</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    {/* BOOKING SUMMARY */}
                    <section className="space-y-3">
                        <div className="font-medium text-sm">Booking Summary</div>

                        <div className="space-y-3 rounded-md bg-muted p-4">
                            <div>
                                <div className="font-medium text-[13px] text-muted-foreground">
                                    Project Description
                                </div>
                                <div className="whitespace-pre-wrap text-sm">
                                    {displayDescription}
                                    {needsTruncation && !showFullDescription && "..."}
                                </div>

                                {needsTruncation && (
                                    <Button
                                        className="h-6 text-xs"
                                        onClick={() => setShowFullDescription(!showFullDescription)}
                                        size="sm"
                                        variant="ghost"
                                    >
                                        {showFullDescription ? "Show less" : "Show more"}
                                    </Button>
                                )}
                            </div>

                            {/* Preferred Dates */}
                            {booking.preferredStartDate && booking.preferredEndDate && (
                                <div className="text-sm">
                                    <span className="text-muted-foreground">
                                        Preferred Dates:
                                    </span>
                                    <div>
                                        {formatDate(booking.preferredStartDate)} →{" "}
                                        {formatDate(booking.preferredEndDate)}
                                    </div>
                                </div>
                            )}

                            {/* Total */}
                            <div className="grid grid-cols-2 text-sm">
                                <div className="text-muted-foreground">Total Amount</div>
                                <div className="text-right font-semibold">
                                    {formatAmount(Number(booking.totalAmount))}
                                </div>
                                <div className="text-muted-foreground">Summary</div>
                                <div className="text-right">
                                    {serviceItems.length} services
                                    {booking.workspace ? ", 1 workspace" : ""}
                                </div>
                            </div>
                        </div>
                    </section>

                    <Separator className="my-4" />

                    {/* SERVICES */}
                    {serviceItems.length > 0 && (
                        <>
                            <div className="mb-2 font-medium text-sm">Services</div>

                            <div className="overflow-hidden rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Service</TableHead>
                                            <TableHead className="text-center">Qty</TableHead>
                                            <TableHead className="text-right">Unit Price</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead>Sample</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {visibleServices.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="font-medium text-sm">
                                                                {item.service.name}
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {item.service.category}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    {item.quantity}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatAmount(Number(item.unitPrice))}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatAmount(Number(item.totalPrice))}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-xs">
                                                    {item.sampleName || "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {hasMoreServices && (
                                <Button
                                    className="mt-2 w-full"
                                    onClick={() => setShowAllServices(!showAllServices)}
                                    size="sm"
                                    variant="ghost"
                                >
                                    {showAllServices ? (
                                        <>
                                            <ChevronUp className="mr-2 h-4 w-4" /> Show less
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="mr-2 h-4 w-4" />+
                                            {serviceItems.length - MAX_VISIBLE_SERVICES} more
                                        </>
                                    )}
                                </Button>
                            )}

                            <Separator className="my-4" />
                        </>
                    )}

                    {/* WORKSPACE */}
                    {booking.workspace && (
                        <section>
                            <div className="mb-2 font-medium text-sm">Workspace Booking</div>

                            <div className="space-y-2 rounded-md bg-muted p-3">
                                <Badge className="text-xs" variant="outline">
                                    Workspace
                                </Badge>

                                {booking.workspace.startDate && booking.workspace.endDate && (
                                    <div className="text-sm">
                                        {formatDate(booking.workspace.startDate)} →{" "}
                                        {formatDate(booking.workspace.endDate)}
                                    </div>
                                )}

                                {booking.workspace.notes && (
                                    <div className="text-muted-foreground text-sm">
                                        {booking.workspace.notes}
                                    </div>
                                )}
                            </div>

                            <Separator className="my-4" />
                        </section>
                    )}

                    {/* ADMIN NOTES */}
                    {booking.reviewNotes && (
                        <>
                            <div className="mb-2 font-medium text-sm">Admin Notes</div>
                            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:bg-amber-900/20">
                                {booking.reviewNotes}
                            </div>
                            <Separator className="my-4" />
                        </>
                    )}

                    {/* COMMENT AREA (Reject / Revision) */}
                    {pendingAction &&
                        (pendingAction === "reject" ||
                            pendingAction === "request_revision") && (
                            <section className="space-y-2">
                                <div className="font-medium text-sm">
                                    {pendingAction === "reject"
                                        ? "Rejection Reason"
                                        : "Revision Request Details"}
                                </div>

                                <Textarea
                                    maxLength={500}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={4}
                                    value={comment}
                                />

                                <div className="text-right text-muted-foreground text-xs">
                                    {comment.length}/500
                                </div>

                                <Separator />
                            </section>
                        )}

                    {/* BOTTOM ACTIONS */}
                    <div className="sticky bottom-0 mt-4 flex justify-end gap-2 border-t bg-background pt-3">
                        {canReject && (
                            <Button
                                disabled={mutation.isPending}
                                onClick={() => handleActionClick("reject")}
                                variant="destructive"
                            >
                                {pendingAction === "reject" ? "Confirm Reject" : "Reject"}
                            </Button>
                        )}

                        {canRequestRevision && (
                            <Button
                                disabled={mutation.isPending}
                                onClick={() => handleActionClick("request_revision")}
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
                                onClick={() => handleActionClick("approve")}
                            >
                                Approve
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* CONFIRMATION DIALOG */}
            <AlertDialog onOpenChange={setShowConfirmDialog} open={showConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pendingAction === "approve"
                                ? "Approve Booking"
                                : pendingAction === "reject"
                                    ? "Reject Booking"
                                    : "Request Revision"}
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            {pendingAction === "approve"
                                ? "Are you sure you want to approve this booking?"
                                : pendingAction === "reject"
                                    ? "Are you sure you want to reject this booking? This action cannot be undone."
                                    : "Are you sure you want to request a revision for this booking?"}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel
                            disabled={mutation.isPending}
                            onClick={() => {
                                setShowConfirmDialog(false);
                                setPendingAction(null);
                                setComment("");
                            }}
                        >
                            Cancel
                        </AlertDialogCancel>

                        <AlertDialogAction
                            disabled={mutation.isPending}
                            onClick={handleConfirmAction}
                        >
                            {mutation.isPending ? "Processing..." : "Confirm"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
