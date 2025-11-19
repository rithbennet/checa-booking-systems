"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/shared/ui/shadcn/textarea";
import { useAdminBookingAction } from "../lib/useAdminBookingList";

interface AdminBookingActionDialogProps {
	bookingId: string;
	action: "approve" | "reject" | "request_revision";
	onClose: () => void;
}

const ACTION_TITLES = {
	approve: "Approve Booking",
	reject: "Reject Booking",
	request_revision: "Request Revision",
};

const ACTION_DESCRIPTIONS = {
	approve: "Are you sure you want to approve this booking?",
	reject:
		"Are you sure you want to reject this booking? You can provide an optional reason below.",
	request_revision:
		"Request the user to revise their booking. You can provide specific feedback below.",
};

export function AdminBookingActionDialog({
	bookingId,
	action,
	onClose,
}: AdminBookingActionDialogProps) {
	const [comment, setComment] = useState("");
	const mutation = useAdminBookingAction();

	const handleConfirm = async () => {
		try {
			await mutation.mutateAsync({
				id: bookingId,
				action,
				comment: comment.trim() || undefined,
			});

			const messages = {
				approve: "Booking approved successfully",
				reject: "Booking rejected successfully",
				request_revision: "Revision requested successfully",
			};

			toast.success(messages[action]);
			onClose();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Action failed");
		}
	};

	const needsComment = action === "reject" || action === "request_revision";

	return (
		<AlertDialog onOpenChange={onClose} open>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{ACTION_TITLES[action]}</AlertDialogTitle>
					<AlertDialogDescription>
						{ACTION_DESCRIPTIONS[action]}
					</AlertDialogDescription>
				</AlertDialogHeader>

				{needsComment && (
					<div className="py-4">
						<Textarea
							onChange={(e) => setComment(e.target.value)}
							placeholder={
								action === "reject"
									? "Optional rejection reason..."
									: "Specific items to revise..."
							}
							rows={4}
							value={comment}
						/>
					</div>
				)}

				<AlertDialogFooter>
					<AlertDialogCancel disabled={mutation.isPending}>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						disabled={mutation.isPending}
						onClick={handleConfirm}
					>
						{mutation.isPending ? "Processing..." : "Confirm"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
