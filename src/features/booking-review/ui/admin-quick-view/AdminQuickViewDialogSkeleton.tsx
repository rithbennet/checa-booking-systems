"use client";

import { X } from "lucide-react";
import { Button } from "@/shared/ui/shadcn/button";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import { Skeleton } from "@/shared/ui/shadcn/skeleton";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";

interface AdminQuickViewDialogSkeletonProps {
    onClose: () => void;
}

export function AdminQuickViewDialogSkeleton({
    onClose,
}: AdminQuickViewDialogSkeletonProps) {
    return (
        <DialogContent
            className="max-h-[95vh] max-w-3xl overflow-y-auto rounded-xl p-6"
            showCloseButton={false}
        >
            <DialogHeader>
                <DialogTitle>
                    <Skeleton className="h-6 w-48" />
                </DialogTitle>
            </DialogHeader>

            <div className="mb-3 flex items-start justify-between">
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                </div>

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

            <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-md" />
                <Skeleton className="h-24 w-full rounded-md" />
            </div>
        </DialogContent>
    );
}

