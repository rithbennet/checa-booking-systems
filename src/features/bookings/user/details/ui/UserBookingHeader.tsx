/**
 * UserBookingHeader Component
 *
 * Displays booking reference, status, and key actions for the user.
 */

"use client";

import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import type { UserBookingDetailVM } from "@/entities/booking/model/user-detail-types";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import { formatDate, getStatusColor, getStatusLabel } from "../lib/helpers";

interface UserBookingHeaderProps {
	booking: UserBookingDetailVM;
}

export function UserBookingHeader({ booking }: UserBookingHeaderProps) {
	const canEdit =
		booking.status === "draft" || booking.status === "revision_requested";

	return (
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
					</div>
				</div>

				{/* Review Notes Alert */}
				{booking.reviewNotes && booking.status === "revision_requested" && (
					<div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
						<p className="font-semibold text-amber-800 text-sm">
							Revision Requested
						</p>
						<p className="mt-1 text-amber-700 text-sm">{booking.reviewNotes}</p>
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

				{booking.status === "pending_user_verification" && (
					<div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
						<p className="text-sm text-yellow-800">
							Your account needs verification before this booking can be
							approved. Please wait for an administrator to verify your account.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
