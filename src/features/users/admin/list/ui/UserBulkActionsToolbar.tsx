"use client";

import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/shared/ui/shadcn/button";

interface UserBulkActionsToolbarProps {
	selectedCount: number;
	onApprove: () => void;
	onReject: () => void;
	onClearSelection: () => void;
	isProcessing: boolean;
}

export function UserBulkActionsToolbar({
	selectedCount,
	onApprove,
	onReject,
	onClearSelection,
	isProcessing,
}: UserBulkActionsToolbarProps) {
	if (selectedCount === 0) return null;

	return (
		<div className="mb-4 flex items-center justify-between rounded-lg border bg-muted/50 p-3">
			<span className="font-medium text-sm">
				{selectedCount} pending user{selectedCount !== 1 ? "s" : ""} selected
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
					Approve All
				</Button>
				<Button
					disabled={isProcessing}
					onClick={onReject}
					size="sm"
					variant="destructive"
				>
					{isProcessing ? (
						<Loader2 className="mr-2 size-4 animate-spin" />
					) : (
						<X className="mr-2 size-4" />
					)}
					Reject All
				</Button>
				<Button onClick={onClearSelection} size="sm" variant="outline">
					Clear Selection
				</Button>
			</div>
		</div>
	);
}
