"use client";

import { Button } from "./shadcn/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./shadcn/dialog";

interface ConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: "default" | "destructive";
	onConfirm: () => void | Promise<void>;
	loading?: boolean;
}

export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	variant = "default",
	onConfirm,
	loading = false,
}: ConfirmDialogProps) {
	const handleConfirm = async () => {
		await onConfirm();
		onOpenChange(false);
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						disabled={loading}
						onClick={() => onOpenChange(false)}
						variant="outline"
					>
						{cancelLabel}
					</Button>
					<Button disabled={loading} onClick={handleConfirm} variant={variant}>
						{loading ? "Processing..." : confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
