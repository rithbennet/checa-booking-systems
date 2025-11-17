"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2 } from "lucide-react";
import type { BookingDetailVM } from "@/entities/booking/model/types";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import { formatAmount, formatDate } from "../lib/admin-formatters";
import { getAdminStatusBadgeClassName } from "../model/admin-list.utils";

interface AdminQuickViewDialogProps {
    bookingId: string;
    onClose: () => void;
    onOpenFullPage: (id: string) => void;
    onAction?: (action: "approve" | "reject" | "request_revision") => void;
}

export function AdminQuickViewDialog({
    bookingId,
    onClose,
    onOpenFullPage,
}: AdminQuickViewDialogProps) {
    const { data: booking, isLoading } = useQuery({
        queryKey: ["admin", "bookings", "detail", bookingId],
        queryFn: async (): Promise<BookingDetailVM> => {
            const res = await fetch(`/api/admin/bookings/${bookingId}`);
            if (!res.ok) throw new Error("Failed to load booking");
            return res.json();
        },
    });

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

    return (
        <Dialog onOpenChange={onClose} open>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle>{booking.referenceNumber}</DialogTitle>
                            <DialogDescription>
                                {booking.user.name} • {booking.user.email}
                            </DialogDescription>
                        </div>
                        <Badge className={getAdminStatusBadgeClassName(status)}>
                            {status.replace(/_/g, " ")}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Organization */}
                    {booking.organization && (
                        <div>
                            <div className="font-medium text-sm">Organization</div>
                            <div className="text-muted-foreground text-sm">
                                {booking.organization.company}
                                {booking.organization.branch &&
                                    ` • ${booking.organization.branch}`}
                            </div>
                        </div>
                    )}

                    {/* Project Description */}
                    {booking.projectDescription && (
                        <div>
                            <div className="font-medium text-sm">Project Description</div>
                            <div className="text-muted-foreground text-sm">
                                {booking.projectDescription}
                            </div>
                        </div>
                    )}

                    {/* Services */}
                    <div>
                        <div className="font-medium text-sm">Services</div>
                        <div className="mt-2 space-y-2">
                            {booking.serviceItems.map((item) => (
                                <div
                                    className="flex items-center justify-between rounded-lg border p-2"
                                    key={item.id}
                                >
                                    <div>
                                        <div className="text-sm">{item.service.name}</div>
                                        <div className="text-muted-foreground text-xs">
                                            Quantity: {item.quantity}
                                            {item.sampleName && ` • Sample: ${item.sampleName}`}
                                        </div>
                                    </div>
                                    <div className="font-medium text-sm">
                                        {formatAmount(item.totalPrice)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Workspace */}
                    {booking.workspace && (
                        <div>
                            <div className="font-medium text-sm">Workspace Booking</div>
                            <div className="text-muted-foreground text-sm">
                                {booking.workspace.startDate && booking.workspace.endDate && (
                                    <>
                                        {formatDate(booking.workspace.startDate)} →{" "}
                                        {formatDate(booking.workspace.endDate)}
                                    </>
                                )}
                                {booking.workspace.notes && (
                                    <div className="mt-1">{booking.workspace.notes}</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Total Amount */}
                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="font-bold">Total Amount</div>
                        <div className="font-bold text-lg">
                            {formatAmount(booking.totalAmount)}
                        </div>
                    </div>

                    {/* Review Notes */}
                    {booking.reviewNotes && (
                        <div className="rounded-lg bg-amber-50 p-3">
                            <div className="font-medium text-sm">Admin Notes</div>
                            <div className="text-sm">{booking.reviewNotes}</div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button onClick={onClose} variant="outline">
                        Close
                    </Button>
                    <Button onClick={() => onOpenFullPage(bookingId)} variant="default">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Full Page
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
