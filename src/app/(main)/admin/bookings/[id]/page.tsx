"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAdminBookingDetail } from "@/entities/booking/api/useAdminBookingDetail";
import type { BookingDetailVM } from "@/entities/booking/model/types";
import {
	formatCurrency,
	formatDate,
} from "@/features/booking-review/lib/formatters";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { Button } from "@/shared/ui/shadcn/button";

export default function AdminBookingDetailPage() {
	const params = useParams();
	const id = params?.id as string;
	const { data: booking, isLoading } = useAdminBookingDetail(id) as unknown as {
		data: BookingDetailVM | undefined;
		isLoading: boolean;
	};

	if (isLoading) {
		return <div className="p-8 text-center">Loading booking details...</div>;
	}

	if (!booking) {
		return <div className="p-8 text-center">Booking not found</div>;
	}

	return (
		<div className="container space-y-6 py-8">
			<div className="flex items-center gap-4">
				<Button asChild size="icon" variant="ghost">
					<Link href="/admin/bookings">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<h1 className="font-bold text-2xl">
						Booking {booking.referenceNumber}
					</h1>
					<p className="text-muted-foreground">
						Created {formatDate(booking.createdAt)}
					</p>
				</div>
				<StatusBadge status={booking.status} />
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<div className="space-y-4 rounded-lg border p-6">
					<h2 className="font-semibold text-lg">User Information</h2>
					<dl className="space-y-2">
						<div>
							<dt className="text-muted-foreground text-sm">Name</dt>
							<dd className="font-medium">{booking.user.name}</dd>
						</div>
						<div>
							<dt className="text-muted-foreground text-sm">Email</dt>
							<dd>{booking.user.email}</dd>
						</div>
					</dl>
				</div>

				<div className="space-y-4 rounded-lg border p-6">
					<h2 className="font-semibold text-lg">Booking Details</h2>
					<dl className="space-y-2">
						<div>
							<dt className="text-muted-foreground text-sm">Total Amount</dt>
							<dd className="font-semibold text-lg">
								{formatCurrency(booking.totalAmount)}
							</dd>
						</div>
						<div>
							<dt className="text-muted-foreground text-sm">Status</dt>
							<dd>
								<StatusBadge status={booking.status} />
							</dd>
						</div>
					</dl>
				</div>
			</div>

			{booking.projectDescription && (
				<div className="space-y-4 rounded-lg border p-6">
					<h2 className="font-semibold text-lg">Project Description</h2>
					<p className="text-muted-foreground">{booking.projectDescription}</p>
				</div>
			)}

			<div className="space-y-4 rounded-lg border p-6">
				<h2 className="font-semibold text-lg">Services</h2>
				<div className="space-y-4">
					{booking.serviceItems.map(
						(item: BookingDetailVM["serviceItems"][0]) => (
							<div
								className="flex justify-between border-b pb-4 last:border-0 last:pb-0"
								key={item.id}
							>
								<div>
									<div className="font-medium">{item.service.name}</div>
									<div className="text-muted-foreground text-sm">
										Quantity: {item.quantity}
									</div>
									{item.sampleName && (
										<div className="text-muted-foreground text-sm">
											Sample: {item.sampleName}
										</div>
									)}
								</div>
								<div className="text-right">
									<div className="font-medium">
										{formatCurrency(item.totalPrice)}
									</div>
									<div className="text-muted-foreground text-sm">
										{formatCurrency(item.unitPrice)} each
									</div>
								</div>
							</div>
						),
					)}
				</div>
			</div>

			{booking.reviewNotes && (
				<div className="space-y-4 rounded-lg border bg-muted/50 p-6">
					<h2 className="font-semibold text-lg">Review Notes</h2>
					<p>{booking.reviewNotes}</p>
				</div>
			)}
		</div>
	);
}
