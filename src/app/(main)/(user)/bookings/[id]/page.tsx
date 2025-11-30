"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useUserBookingDetail } from "@/entities/booking/api";
import { UserBookingDetail } from "@/features/bookings/user/details";
import { Button } from "@/shared/ui/shadcn/button";

export default function BookingDetailPage() {
	const params = useParams();
	const id = params?.id as string;
	const { data: booking, isLoading, error } = useUserBookingDetail(id);

	if (isLoading) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="h-8 w-8 animate-spin text-slate-400" />
					<p className="text-slate-500">Loading booking details...</p>
				</div>
			</div>
		);
	}

	if (error || !booking) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<div className="flex flex-col items-center gap-4 text-center">
					<p className="font-semibold text-slate-900">Booking not found</p>
					<p className="text-slate-500 text-sm">
						The booking you're looking for doesn't exist or you don't have
						permission to view it.
					</p>
					<Button asChild variant="outline">
						<Link href="/bookings">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Bookings
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	return <UserBookingDetail booking={booking} />;
}
