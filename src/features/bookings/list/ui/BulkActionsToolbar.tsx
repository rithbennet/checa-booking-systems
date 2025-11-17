"use client";

import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/shadcn/button";

interface BulkActionsToolbarProps {
    selectedCount: number;
    onDelete: () => void;
    onClearSelection: () => void;
    isDeleting: boolean;
}

export function BulkActionsToolbar({
    selectedCount,
    onDelete,
    onClearSelection,
    isDeleting,
}: BulkActionsToolbarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="mb-4 flex items-center justify-between rounded-lg border bg-muted/50 p-3">
            <span className="font-medium text-sm">
                {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2">
                <Button
                    disabled={isDeleting}
                    onClick={onDelete}
                    size="sm"
                    variant="destructive"
                >
                    {isDeleting ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                        <Trash2 className="mr-2 size-4" />
                    )}
                    Delete Selected
                </Button>
                <Button onClick={onClearSelection} size="sm" variant="outline">
                    Clear Selection
                </Button>
            </div>
        </div>
    );
}
