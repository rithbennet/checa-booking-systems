/**
 * SampleModificationModal Component
 *
 * Modal for creating sample modification requests.
 * Admins can request quantity changes which require customer approval.
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2, Package } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { ServiceItemVM } from "@/entities/booking/model/command-center-types";
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
import { formatCurrency } from "../lib/helpers";
import { useCreateModification } from "../lib/modification-mutations";
import {
	type CreateModificationInput,
	CreateModificationSchema,
} from "../lib/modification-types";

interface SampleModificationModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	serviceItem: ServiceItemVM;
}

export function SampleModificationModal({
	open,
	onOpenChange,
	serviceItem,
}: SampleModificationModalProps) {
	const mutation = useCreateModification();
	const [preview, setPreview] = useState({
		newQuantity: serviceItem.quantity,
		newTotal: Number(serviceItem.totalPrice),
	});

	const unitPrice = Number(serviceItem.unitPrice);

	const {
		register,
		handleSubmit,
		watch,
		reset,
		formState: { errors },
	} = useForm<CreateModificationInput>({
		resolver: zodResolver(CreateModificationSchema),
		defaultValues: {
			bookingServiceItemId: serviceItem.id,
			newQuantity: serviceItem.quantity,
			newDurationMonths: 0,
			reason: "",
		},
	});

	// Watch quantity changes for price preview
	const watchedQuantity = watch("newQuantity");
	if (
		watchedQuantity !== preview.newQuantity &&
		!Number.isNaN(watchedQuantity)
	) {
		setPreview({
			newQuantity: watchedQuantity,
			newTotal: unitPrice * watchedQuantity,
		});
	}

	const priceDifference = preview.newTotal - Number(serviceItem.totalPrice);

	const onSubmit = (data: CreateModificationInput) => {
		mutation.mutate(data, {
			onSuccess: () => {
				reset();
				onOpenChange(false);
			},
		});
	};

	const handleClose = () => {
		reset();
		setPreview({
			newQuantity: serviceItem.quantity,
			newTotal: Number(serviceItem.totalPrice),
		});
		onOpenChange(false);
	};

	return (
		<Dialog onOpenChange={handleClose} open={open}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Package className="h-5 w-5 text-blue-600" />
						Request Sample Modification
					</DialogTitle>
					<DialogDescription>
						Request a change to sample quantity or duration. The customer will
						need to approve this modification before it takes effect.
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
								className={errors.newQuantity ? "border-red-500" : ""}
							/>
							{errors.newQuantity && (
								<p className="text-red-500 text-xs">
									{errors.newQuantity.message}
								</p>
							)}
						</div>

						{/* Price Preview */}
						<div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
							<div className="flex items-center justify-between">
								<span className="text-slate-600 text-sm">New Total:</span>
								<span className="font-bold text-slate-900">
									{formatCurrency(preview.newTotal.toString())}
								</span>
							</div>
							{priceDifference !== 0 && (
								<div className="mt-1 flex items-center justify-between">
									<span className="text-slate-500 text-xs">Difference:</span>
									<span
										className={`font-medium text-xs ${priceDifference > 0 ? "text-green-600" : "text-red-600"}`}
									>
										{priceDifference > 0 ? "+" : ""}
										{formatCurrency(priceDifference.toString())}
									</span>
								</div>
							)}
						</div>

						{/* Reason */}
						<div className="space-y-2">
							<Label htmlFor="reason">Reason for Modification</Label>
							<Textarea
								id="reason"
								placeholder="Explain why this modification is needed..."
								rows={3}
								{...register("reason")}
								className={errors.reason ? "border-red-500" : ""}
							/>
							{errors.reason && (
								<p className="text-red-500 text-xs">{errors.reason.message}</p>
							)}
						</div>

						{/* Customer Approval Notice */}
						<div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
							<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
							<div className="text-xs">
								<p className="font-medium text-amber-800">
									Customer Approval Required
								</p>
								<p className="mt-0.5 text-amber-700">
									The customer will receive a notification and must approve this
									modification before it is applied to the booking.
								</p>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							disabled={mutation.isPending}
							onClick={handleClose}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							disabled={
								mutation.isPending ||
								preview.newQuantity === serviceItem.quantity
							}
							type="submit"
						>
							{mutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Submit Request
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
