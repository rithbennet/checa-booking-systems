"use client";

import { Ban, Check, Loader2, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/shared/ui/shadcn/button";

interface AdminBulkActionsToolbarProps {
    selectedCount: number;
    onApprove: () => void;
    onReject: () => void;
    onRequestRevision: () => void;
    onDelete: () => void;
    onClearSelection: () => void;
    isProcessing: boolean;
}

export function AdminBulkActionsToolbar({
    selectedCount,
    onApprove,
    onReject,
    onRequestRevision,
    onDelete,
    onClearSelection,
    isProcessing,
}: AdminBulkActionsToolbarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="mb-4 flex items-center justify-between rounded-lg border bg-muted/50 p-3">
            <span className="font-medium text-sm">
                {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2">
                <Button
                    disabled={isProcessing}
                    onClick={onApprove}
                    size="sm"
                    variant="default"
                >
                    {isProcessing ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                        <Check className="mr-2 size-4" />
                    )}
                    Approve Selected
                </Button>
                <Button
                    disabled={isProcessing}
                    onClick={onRequestRevision}
                    size="sm"
                    variant="outline"
                >
                    <Undo2 className="mr-2 size-4" />
                    Request Revision
                </Button>
                <Button
                    disabled={isProcessing}
                    onClick={onReject}
                    size="sm"
                    variant="outline"
                >
                    <Ban className="mr-2 size-4" />
                    Reject Selected
                </Button>
                <Button
                    disabled={isProcessing}
                    onClick={onDelete}
                    size="sm"
                    variant="destructive"
                >
                    <Trash2 className="mr-2 size-4" />
                    Delete Selected
                </Button>
                <Button
                    disabled={isProcessing}
                    onClick={onClearSelection}
                    size="sm"
                    variant="ghost"
                >
                    Clear
                </Button>
            </div>
        </div>
    );
}
