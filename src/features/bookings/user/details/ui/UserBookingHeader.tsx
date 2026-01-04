/**
 * UserBookingHeader Component
 *
 * Displays booking reference, status, and key actions for the user.
 */

"use client";

import { ArrowLeft, Ban, Edit, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useCancelBooking } from "@/entities/booking/api";
import type { UserBookingDetailVM } from "@/entities/booking/model/user-detail-types";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/shared/ui/shadcn/alert-dialog";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import { Label } from "@/shared/ui/shadcn/label";
import { Textarea } from "@/shared/ui/shadcn/textarea";
import { formatDate, getStatusColor, getStatusLabel } from "../lib/helpers";

interface UserBookingHeaderProps {
	booking: UserBookingDetailVM;
}

export function UserBookingHeader({ booking }: UserBookingHeaderProps) {
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [cancelReason, setCancelReason] = useState("");
	const [cancelError, setCancelError] = useState<string | null>(null);
	const cancelBooking = useCancelBooking();

	const canEdit =
		booking.status === "draft" || booking.status === "revision_requested";

	const canCancel =
		booking.status !== "cancelled" && booking.status !== "completed";

	const isCancelled = booking.status === "cancelled";

	const handleCancelBooking = async () => {
		setCancelError(null);
		try {
			await cancelBooking.mutateAsync({
				bookingId: booking.id,
				reason: cancelReason.trim() || undefined,
			});
			setShowCancelDialog(false);
			setCancelReason("");
			setCancelError(null);
		} catch (error) {
			console.error("Failed to cancel booking:", error);
			setCancelError(
				error instanceof Error ? error.message : "Cancellation failed",
			);
			// Keep dialog open on error so user can retry
		}
	};

	return (
		<>
			<div className="mb-6">
				{/* Back Button */}
				<Button asChild className="mb-4" size="sm" variant="ghost">
					<Link href="/bookings">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Bookings
					</Link>
				</Button>

				{/* Header Card */}
				<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
					<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
						{/* Left: Reference & Created Date */}
						<div>
							<div className="flex items-center gap-3">
								<h1 className="font-bold text-2xl text-slate-900">
									{booking.referenceNumber}
								</h1>
								<Badge
									className={getStatusColor(booking.status)}
									variant="outline"
								>
									{getStatusLabel(booking.status)}
								</Badge>
							</div>
							<p className="mt-1 text-slate-500 text-sm">
								Created on {formatDate(booking.createdAt)}
							</p>
						</div>

						{/* Right: Actions */}
						<div className="flex items-center gap-3">
							{canEdit && (
								<Button asChild>
									<Link href={`/bookings/${booking.id}/edit`}>
										<Edit className="mr-2 h-4 w-4" />
										{booking.status === "revision_requested"
											? "Continue Editing"
											: "Edit Draft"}
									</Link>
								</Button>
							)}
							{canCancel && (
								<Button
									className="border-red-300 text-red-600 hover:bg-red-50"
									onClick={() => setShowCancelDialog(true)}
									variant="outline"
								>
									<Ban className="mr-2 h-4 w-4" />
									Cancel Booking
								</Button>
							)}
						</div>
					</div>

					{/* Review Notes Alert */}
					{booking.reviewNotes && booking.status === "revision_requested" && (
						<div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
							<p className="font-semibold text-amber-800 text-sm">
								Revision Requested
							</p>
							<p className="mt-1 text-amber-700 text-sm">
								{booking.reviewNotes}
							</p>
						</div>
					)}

					{booking.reviewNotes && booking.status === "rejected" && (
						<div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
							<p className="font-semibold text-red-800 text-sm">
								Booking Rejected
							</p>
							<p className="mt-1 text-red-700 text-sm">{booking.reviewNotes}</p>
						</div>
					)}

					{booking.reviewNotes && isCancelled && (
						<div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
							<p className="font-semibold text-red-800 text-sm">
								Booking Cancelled
							</p>
							<p className="mt-1 text-red-700 text-sm">{booking.reviewNotes}</p>
						</div>
					)}

					{booking.status === "pending_user_verification" && (
						<div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
							<p className="text-sm text-yellow-800">
								Your account needs verification before this booking can be
								approved. Please wait for an administrator to verify your
								account.
							</p>
						</div>
					)}
				</div>
			</div>

			<AlertDialog
				onOpenChange={(open) => {
					setShowCancelDialog(open);
					if (!open) {
						setCancelError(null);
					}
				}}
				open={showCancelDialog}
			>
				<AlertDialogContent className="sm:max-w-[500px]">
					<AlertDialogHeader>
						<AlertDialogTitle>Cancel Booking</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to cancel this booking? This action cannot
							be undone. You'll need to create a new booking if you wish to
							proceed later.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="grid gap-2 py-4">
						<Label htmlFor="reason">Cancellation Reason (Optional)</Label>
						<Textarea
							disabled={cancelBooking.isPending}
							id="reason"
							onChange={(e) => setCancelReason(e.target.value)}
							placeholder="Let us know why you're cancelling..."
							rows={3}
							value={cancelReason}
						/>
						{cancelError && (
							<div
								className="rounded-lg border border-red-200 bg-red-50 p-3"
								role="alert"
							>
								<p className="text-red-800 text-sm">{cancelError}</p>
							</div>
						)}
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={cancelBooking.isPending}>
							Keep Booking
						</AlertDialogCancel>
						<Button
							className="bg-red-600 hover:bg-red-700"
							disabled={cancelBooking.isPending}
							onClick={handleCancelBooking}
						>
							{cancelBooking.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Cancel Booking
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
