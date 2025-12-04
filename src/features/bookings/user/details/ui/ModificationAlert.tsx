/**
 * ModificationAlert Component
 *
 * Displays pending modification requests to users and allows them to approve/reject.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangle,
	ArrowRight,
	Check,
	Loader2,
	Package,
	X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { bookingKeys } from "@/entities/booking/api/query-keys";
import type { UserModificationVM } from "@/entities/booking/model/user-detail-types";
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
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";

interface ModificationAlertProps {
	modifications: UserModificationVM[];
	bookingId: string;
}

async function respondToModification(params: {
	modificationId: string;
	approved: boolean;
	notes?: string;
}) {
	const res = await fetch(`/api/user/modifications/${params.modificationId}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			approved: params.approved,
			notes: params.notes,
		}),
	});

	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		throw new Error(error.error || "Failed to respond to modification");
	}

	return res.json();
}

function formatCurrency(amount: string | number): string {
	const num = typeof amount === "string" ? Number.parseFloat(amount) : amount;
	return new Intl.NumberFormat("en-MY", {
		style: "currency",
		currency: "MYR",
		minimumFractionDigits: 2,
	}).format(num);
}

export function ModificationAlert({
	modifications,
	bookingId,
}: ModificationAlertProps) {
	const queryClient = useQueryClient();
	const [confirmDialog, setConfirmDialog] = useState<{
		open: boolean;
		modificationId: string | null;
		action: "approve" | "reject" | null;
	}>({
		open: false,
		modificationId: null,
		action: null,
	});

	const respondMutation = useMutation({
		mutationFn: respondToModification,
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: bookingKeys.userDetail(bookingId),
			});
			toast.success(
				variables.approved ? "Modification approved" : "Modification rejected",
				{
					description: variables.approved
						? "The changes have been applied to your booking"
						: "The modification request has been declined",
				},
			);
		},
		onError: (error: Error) => {
			toast.error("Failed to respond", {
				description: error.message,
			});
		},
	});

	// Filter to only show pending admin-initiated modifications
	const pendingAdminModifications = modifications.filter(
		(m) => m.status === "pending" && m.initiatedByAdmin,
	);

	if (pendingAdminModifications.length === 0) {
		return null;
	}

	const handleAction = (
		modificationId: string,
		action: "approve" | "reject",
	) => {
		setConfirmDialog({
			open: true,
			modificationId,
			action,
		});
	};

	const confirmAction = () => {
		if (!confirmDialog.modificationId || !confirmDialog.action) return;

		respondMutation.mutate({
			modificationId: confirmDialog.modificationId,
			approved: confirmDialog.action === "approve",
		});

		setConfirmDialog({ open: false, modificationId: null, action: null });
	};

	return (
		<>
			<Card className="border-amber-200 bg-amber-50/50">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<AlertTriangle className="h-5 w-5 text-amber-600" />
						<CardTitle className="text-amber-900 text-base">
							Modification Requests
						</CardTitle>
					</div>
					<CardDescription className="text-amber-700">
						The lab has requested changes to your booking. Please review and
						respond.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{pendingAdminModifications.map((modification) => {
						const priceDiff =
							Number.parseFloat(modification.newTotalPrice) -
							Number.parseFloat(modification.originalTotalPrice);
						const isIncrease = priceDiff > 0;

						return (
							<div
								className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm"
								key={modification.id}
							>
								{/* Service Name */}
								<div className="mb-3 flex items-center gap-2">
									<Package className="h-4 w-4 text-slate-400" />
									<span className="font-medium text-slate-900 text-sm">
										{modification.serviceName}
									</span>
								</div>

								{/* Quantity Change */}
								<div className="mb-3 flex items-center gap-3 rounded-lg bg-slate-50 p-3">
									<div className="text-center">
										<p className="font-bold text-2xl text-slate-400">
											{modification.originalQuantity}
										</p>
										<p className="text-[10px] text-slate-500">Current</p>
									</div>
									<ArrowRight className="h-5 w-5 text-slate-400" />
									<div className="text-center">
										<p className="font-bold text-2xl text-slate-900">
											{modification.newQuantity}
										</p>
										<p className="text-[10px] text-slate-500">New</p>
									</div>
									<div className="ml-auto text-right">
										<Badge
											className={
												isIncrease
													? "border-orange-200 bg-orange-100 text-orange-700"
													: "border-green-200 bg-green-100 text-green-700"
											}
											variant="outline"
										>
											{isIncrease ? "+" : ""}
											{formatCurrency(priceDiff)}
										</Badge>
										<p className="mt-1 text-[10px] text-slate-500">
											New total: {formatCurrency(modification.newTotalPrice)}
										</p>
									</div>
								</div>

								{/* Reason */}
								<div className="mb-4 rounded border-amber-200 border-l-2 bg-amber-50 py-2 pr-3 pl-3">
									<p className="font-medium text-[10px] text-amber-800">
										Reason from Lab:
									</p>
									<p className="text-amber-900 text-sm">
										{modification.reason}
									</p>
								</div>

								{/* Creator & Date */}
								<div className="mb-4 flex items-center justify-between text-[11px] text-slate-500">
									<span>
										Requested by{" "}
										<span className="font-medium text-slate-700">
											{modification.createdBy.firstName}{" "}
											{modification.createdBy.lastName}
										</span>
									</span>
									<span>
										{new Date(modification.createdAt).toLocaleDateString(
											"en-MY",
											{
												day: "numeric",
												month: "short",
												year: "numeric",
											},
										)}
									</span>
								</div>

								{/* Actions */}
								<div className="flex gap-2">
									<Button
										className="flex-1 bg-green-600 text-white hover:bg-green-700"
										disabled={respondMutation.isPending}
										onClick={() => handleAction(modification.id, "approve")}
										size="sm"
									>
										{respondMutation.isPending ? (
											<Loader2 className="mr-1 h-4 w-4 animate-spin" />
										) : (
											<Check className="mr-1 h-4 w-4" />
										)}
										Approve
									</Button>
									<Button
										className="flex-1"
										disabled={respondMutation.isPending}
										onClick={() => handleAction(modification.id, "reject")}
										size="sm"
										variant="outline"
									>
										<X className="mr-1 h-4 w-4" />
										Reject
									</Button>
								</div>
							</div>
						);
					})}
				</CardContent>
			</Card>

			{/* Confirmation Dialog */}
			<AlertDialog
				onOpenChange={(open) => {
					if (!open) {
						setConfirmDialog({
							open: false,
							modificationId: null,
							action: null,
						});
					}
				}}
				open={confirmDialog.open}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{confirmDialog.action === "approve"
								? "Approve Modification?"
								: "Reject Modification?"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{confirmDialog.action === "approve"
								? "This will update your booking with the new quantities and prices. The change will be applied immediately."
								: "This will decline the lab's modification request. Your booking will remain unchanged."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className={
								confirmDialog.action === "approve"
									? "bg-green-600 hover:bg-green-700"
									: "bg-red-600 hover:bg-red-700"
							}
							onClick={confirmAction}
						>
							{confirmDialog.action === "approve" ? "Approve" : "Reject"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
