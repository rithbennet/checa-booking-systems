/**
 * UserModificationModal Component
 *
 * Modal for users to request quantity/duration changes to their booking.
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { bookingKeys } from "@/entities/booking/api/query-keys";
import type { UserServiceItemVM } from "@/entities/booking/model/user-detail-types";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import { Textarea } from "@/shared/ui/shadcn/textarea";

const CreateModificationSchema = z.object({
	newQuantity: z.number().int().min(1, "Quantity must be at least 1"),
	reason: z
		.string()
		.min(10, "Please provide a detailed reason (at least 10 characters)"),
});

type CreateModificationInput = z.infer<typeof CreateModificationSchema>;

interface UserModificationModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	serviceItem: UserServiceItemVM | null;
	bookingId: string;
}

function formatCurrency(amount: string | number): string {
	const num = typeof amount === "string" ? Number.parseFloat(amount) : amount;
	return new Intl.NumberFormat("en-MY", {
		style: "currency",
		currency: "MYR",
		minimumFractionDigits: 2,
	}).format(num);
}

async function createModification(params: {
	bookingServiceItemId: string;
	newQuantity: number;
	reason: string;
}) {
	const res = await fetch("/api/user/modifications", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(params),
	});

	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		throw new Error(error.error || "Failed to create modification request");
	}

	return res.json();
}

export function UserModificationModal({
	open,
	onOpenChange,
	serviceItem,
	bookingId,
}: UserModificationModalProps) {
	const queryClient = useQueryClient();
	const [newTotalPrice, setNewTotalPrice] = useState<number | null>(null);

	const {
		register,
		handleSubmit,
		watch,
		reset,
		formState: { errors, isValid },
	} = useForm<CreateModificationInput>({
		resolver: zodResolver(CreateModificationSchema),
		mode: "onChange",
		defaultValues: {
			newQuantity: serviceItem?.quantity ?? 1,
			reason: "",
		},
	});

	const newQuantity = watch("newQuantity");

	// Reset form when service item changes
	useEffect(() => {
		if (serviceItem) {
			reset({
				newQuantity: serviceItem.quantity,
				reason: "",
			});
		}
	}, [serviceItem, reset]);

	// Calculate new total when quantity changes
	useEffect(() => {
		if (serviceItem && newQuantity) {
			const unitPrice = Number.parseFloat(serviceItem.unitPrice);
			setNewTotalPrice(unitPrice * newQuantity);
		} else {
			setNewTotalPrice(null);
		}
	}, [serviceItem, newQuantity]);

	const createMutation = useMutation({
		mutationFn: createModification,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: bookingKeys.userDetail(bookingId),
			});
			toast.success("Modification request submitted", {
				description: "The lab will review your request and respond shortly",
			});
			onOpenChange(false);
			reset();
		},
		onError: (error: Error) => {
			toast.error("Failed to submit request", {
				description: error.message,
			});
		},
	});

	const onSubmit = (data: CreateModificationInput) => {
		if (!serviceItem) return;

		createMutation.mutate({
			bookingServiceItemId: serviceItem.id,
			newQuantity: data.newQuantity,
			reason: data.reason,
		});
	};

	if (!serviceItem) return null;

	const priceDifference =
		newTotalPrice !== null
			? newTotalPrice - Number.parseFloat(serviceItem.totalPrice)
			: 0;
	const hasChange = newQuantity !== serviceItem.quantity;

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Package className="h-5 w-5 text-slate-400" />
						Request Modification
					</DialogTitle>
					<DialogDescription>
						Request a change to sample quantity. The lab administrator will
						review and approve your request.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="space-y-4 py-4">
						{/* Service Info */}
						<div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
							<p className="font-medium text-slate-900 text-sm">
								{serviceItem.service.name}
							</p>
							<p className="mt-1 text-slate-500 text-xs">
								Current: {serviceItem.quantity} samples ×{" "}
								{formatCurrency(serviceItem.unitPrice)} ={" "}
								{formatCurrency(serviceItem.totalPrice)}
							</p>
						</div>

						{/* Quantity Input */}
						<div className="space-y-2">
							<Label htmlFor="newQuantity">New Quantity</Label>
							<Input
								id="newQuantity"
								min={1}
								type="number"
								{...register("newQuantity", { valueAsNumber: true })}
							/>
							{errors.newQuantity && (
								<p className="text-red-600 text-xs">
									{errors.newQuantity.message}
								</p>
							)}
						</div>

						{/* Price Preview */}
						{newTotalPrice !== null && hasChange && (
							<div className="rounded-lg border border-slate-200 bg-white p-3">
								<div className="flex items-center justify-between text-sm">
									<span className="text-slate-500">New Total</span>
									<span className="font-bold text-slate-900">
										{formatCurrency(newTotalPrice)}
									</span>
								</div>
								<div className="mt-1 flex items-center justify-between text-xs">
									<span className="text-slate-400">Difference</span>
									<span
										className={
											priceDifference > 0
												? "font-medium text-orange-600"
												: priceDifference < 0
													? "font-medium text-green-600"
													: "text-slate-400"
										}
									>
										{priceDifference > 0 ? "+" : ""}
										{formatCurrency(priceDifference)}
									</span>
								</div>
							</div>
						)}

						{/* Reason Input */}
						<div className="space-y-2">
							<Label htmlFor="reason">Reason for Change</Label>
							<Textarea
								className="min-h-[100px] resize-none"
								id="reason"
								placeholder="Please explain why you need this modification (min. 10 characters)..."
								{...register("reason")}
							/>
							{errors.reason && (
								<p className="text-red-600 text-xs">{errors.reason.message}</p>
							)}
						</div>

						{/* Warning */}
						<div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-xs">
							<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
							<p>
								Modification requests require lab administrator approval.
								Changes will only take effect after approval.
							</p>
						</div>
					</div>

					<DialogFooter>
						<Button
							disabled={createMutation.isPending}
							onClick={() => onOpenChange(false)}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							disabled={createMutation.isPending || !isValid || !hasChange}
							type="submit"
						>
							{createMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Submitting...
								</>
							) : (
								"Submit Request"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
