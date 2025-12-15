"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/shared/ui/shadcn/alert-dialog";

type MutationParams = {
	id: string;
	action: "approve" | "reject" | "request_revision";
	comment?: string;
};

interface AdminQuickViewConfirmDialogProps {
	pendingAction: "approve" | "reject" | "request_revision" | null;
	showConfirmDialog: boolean;
	mutation: UseMutationResult<unknown, unknown, MutationParams, unknown>;
	onConfirm: () => void;
	onCancel: () => void;
}

export function AdminQuickViewConfirmDialog({
	pendingAction,
	showConfirmDialog,
	mutation,
	onConfirm,
	onCancel,
}: AdminQuickViewConfirmDialogProps) {
	if (!pendingAction) return null;

	const titles = {
		approve: "Approve Booking",
		reject: "Reject Booking",
		request_revision: "Request Revision",
	};

	const descriptions = {
		approve: "Are you sure you want to approve this booking?",
		reject:
			"Are you sure you want to reject this booking? This action cannot be undone.",
		request_revision:
			"Are you sure you want to request a revision for this booking?",
	};

	return (
		<AlertDialog onOpenChange={onCancel} open={showConfirmDialog}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{titles[pendingAction]}</AlertDialogTitle>
					<AlertDialogDescription>
						{descriptions[pendingAction]}
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel disabled={mutation.isPending} onClick={onCancel}>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction disabled={mutation.isPending} onClick={onConfirm}>
						{mutation.isPending ? "Processing..." : "Confirm"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
