"use client";

import { ExternalLink, MapPin, X } from "lucide-react";
import type { BookingDetailVM } from "@/entities/booking/model/types";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
    DialogHeader,
    DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { formatDateTime } from "../../lib/admin-formatters";
import { getAdminStatusBadgeClassName } from "../../model/admin-list.utils";

interface AdminQuickViewDialogHeaderProps {
    booking: BookingDetailVM;
    onClose: () => void;
    onOpenFullPage: (id: string) => void;
}

export function AdminQuickViewDialogHeader({
    booking,
    onClose,
    onOpenFullPage,
}: AdminQuickViewDialogHeaderProps) {
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

    return (
        <div className="mb-3 flex items-start justify-between">
            <DialogHeader className="space-y-1">
                <DialogTitle className="font-semibold text-lg">
                    {booking.referenceNumber}
                </DialogTitle>

                <div className="space-y-1 text-muted-foreground text-sm">
                    <div>
                        <span className="font-medium">Requested by:</span>{" "}
                        {booking.user.name} • {booking.user.email}
                    </div>
                    {orgDisplay && (
                        <div className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {orgDisplay}
                        </div>
                    )}
                    <div className="text-xs">
                        Created: {formatDateTime(booking.createdAt)} • Updated:{" "}
                        {formatDateTime(booking.updatedAt)}
                    </div>
                </div>

                <div className="pt-1">
                    <Badge className={getAdminStatusBadgeClassName(booking.status)}>
                        {booking.status.replace(/_/g, " ")}
                    </Badge>
                </div>
            </DialogHeader>

            <div className="flex items-center gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            className="h-8 w-8"
                            onClick={() => onOpenFullPage(booking.id)}
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
    );
}
