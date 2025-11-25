"use client";

import { Loader2, X } from "lucide-react";
import { Button } from "@/shared/ui/shadcn/button";
import type { DataTableBulkActionsProps } from "./types";

/**
 * Bulk actions toolbar that appears when items are selected
 */
export function DataTableBulkActions({
	selectedCount,
	actions,
	onClearSelection,
	selectedIds,
}: DataTableBulkActionsProps) {
	if (selectedCount === 0) return null;

	return (
		<div className="mb-4 flex items-center justify-between rounded-lg border bg-muted/50 p-3">
			<span className="font-medium text-sm">
				{selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
			</span>
			<div className="flex items-center gap-2">
				{actions.map((action) => (
					<Button
						disabled={action.disabled || action.loading}
						key={action.id}
						onClick={() => action.onClick(selectedIds)}
						size="sm"
						variant={action.variant || "outline"}
					>
						{action.loading ? (
							<Loader2 className="mr-2 size-4 animate-spin" />
						) : (
							action.icon && <span className="mr-2">{action.icon}</span>
						)}
						{action.label}
					</Button>
				))}
				<Button onClick={onClearSelection} size="sm" variant="outline">
					<X className="mr-2 size-4" />
					Clear Selection
				</Button>
			</div>
		</div>
	);
}
