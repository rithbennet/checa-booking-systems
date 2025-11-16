"use client";

import { Loader2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/shared/ui/shadcn/alert-dialog";

type LoadingDialogProps = {
    open: boolean;
    title?: string;
    description?: string;
    // When true, ignore user attempts to close (esc/overlay). Default true
    preventClose?: boolean;
};

/**
 * LoadingDialog — a simple blocking modal to show while awaiting async operations.
 * Designed for submission flows (e.g., booking submission) where the page may redirect afterwards.
 */
export function LoadingDialog({
    open,
    title = "Please wait…",
    description,
    preventClose = true,
}: LoadingDialogProps) {
    // We intentionally do not expose onOpenChange to prevent accidental closure while loading
    const noop = () => { };

    return (
        <AlertDialog onOpenChange={preventClose ? noop : undefined} open={open}>
            <AlertDialogContent aria-busy={open} className="sm:max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <Loader2
                            aria-hidden
                            className="h-5 w-5 animate-spin text-blue-600"
                        />
                        <AlertDialogTitle className="font-semibold text-base">
                            {title}
                        </AlertDialogTitle>
                    </div>
                    {description ? (
                        <AlertDialogDescription className="pt-2 text-sm">
                            {description}
                        </AlertDialogDescription>
                    ) : null}
                </AlertDialogHeader>
            </AlertDialogContent>
        </AlertDialog>
    );
}
