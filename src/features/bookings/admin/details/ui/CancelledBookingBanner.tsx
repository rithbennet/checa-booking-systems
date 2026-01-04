/**
 * CancelledBookingBanner Component
 *
 * Displays a prominent banner for cancelled bookings with reason and timestamp.
 */

"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/shadcn/alert";
import { formatDateTime } from "../lib/helpers";

interface CancelledBookingBannerProps {
    reviewedAt: string | null;
    reviewNotes: string | null;
}

export function CancelledBookingBanner({
    reviewedAt,
    reviewNotes,
}: CancelledBookingBannerProps) {
    // Extract cancellation reason from reviewNotes if present
    const reason = reviewNotes?.startsWith("Cancellation reason:")
        ? reviewNotes.replace("Cancellation reason:", "").trim()
        : reviewNotes || "No reason provided";

    return (
        <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-900">
                Booking Cancelled
                {reviewedAt && (
                    <span className="ml-2 font-normal text-red-600 text-xs">
                        on {formatDateTime(reviewedAt)}
                    </span>
                )}
            </AlertTitle>
            <AlertDescription className="text-red-700 text-sm">
                {reason}
            </AlertDescription>
        </Alert>
    );
}
