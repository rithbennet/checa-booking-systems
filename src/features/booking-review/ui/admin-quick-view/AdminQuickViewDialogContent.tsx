"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import type { BookingDetailVM } from "@/entities/booking/model/types";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
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
import { formatAmount, formatDate } from "../../lib/admin-formatters";

interface AdminQuickViewDialogContentProps {
    booking: BookingDetailVM;
    showAllServices: boolean;
    showFullDescription: boolean;
    pendingAction: "approve" | "reject" | "request_revision" | null;
    comment: string;
    onToggleServices: () => void;
    onToggleDescription: () => void;
    onCommentChange: (value: string) => void;
}

const MAX_VISIBLE_SERVICES = 5;
const MAX_DESCRIPTION_LINES = 3;

export function AdminQuickViewDialogContent({
    booking,
    showAllServices,
    showFullDescription,
    pendingAction,
    comment,
    onToggleServices,
    onToggleDescription,
    onCommentChange,
}: AdminQuickViewDialogContentProps) {
    const serviceItems = booking.serviceItems;
    const visibleServices = showAllServices
        ? serviceItems
        : serviceItems.slice(0, MAX_VISIBLE_SERVICES);
    const hasMoreServices = serviceItems.length > MAX_VISIBLE_SERVICES;

    const descriptionLines = booking.projectDescription?.split("\n") || [];
    const needsTruncation = descriptionLines.length > MAX_DESCRIPTION_LINES;
    const displayDescription = showFullDescription
        ? booking.projectDescription
        : needsTruncation
            ? descriptionLines.slice(0, MAX_DESCRIPTION_LINES).join("\n")
            : booking.projectDescription;

    return (
        <>
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
                                onClick={onToggleDescription}
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
                            <span className="text-muted-foreground">Preferred Dates:</span>
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
                                                <TooltipContent>{item.service.category}</TooltipContent>
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
                            onClick={onToggleServices}
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
                            onChange={(e) => onCommentChange(e.target.value)}
                            rows={4}
                            value={comment}
                        />

                        <div className="text-right text-muted-foreground text-xs">
                            {comment.length}/500
                        </div>

                        <Separator />
                    </section>
                )}
        </>
    );
}
