import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import * as bookingService from "@/entities/booking/server/booking.service";
import { requireCurrentUser } from "@/shared/server/current-user";
import { Alert, AlertDescription } from "@/shared/ui/shadcn/alert";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";

type LoadedBooking = Awaited<ReturnType<typeof bookingService.getBooking>>;

interface BookingDetailPageProps {
	params: Promise<{
		id: string;
	}>;
}

const statusColors = {
	draft: "bg-gray-100 text-gray-800",
	pending_user_verification: "bg-yellow-100 text-yellow-800",
	pending_approval: "bg-blue-100 text-blue-800",
	revision_requested: "bg-amber-100 text-amber-800",
	approved: "bg-green-100 text-green-800",
	rejected: "bg-red-100 text-red-800",
	in_progress: "bg-purple-100 text-purple-800",
	completed: "bg-emerald-100 text-emerald-800",
	cancelled: "bg-gray-100 text-gray-800",
};

const statusLabels = {
	draft: "Draft",
	pending_user_verification: "Pending Verification",
	pending_approval: "Pending Approval",
	revision_requested: "Revision Requested",
	approved: "Approved",
	rejected: "Rejected",
	in_progress: "In Progress",
	completed: "Completed",
	cancelled: "Cancelled",
};

export default async function BookingDetailPage({
	params,
}: BookingDetailPageProps) {
	const { id } = await params;
	const me = await requireCurrentUser();

	let booking: LoadedBooking | null = null;
	try {
		booking = await bookingService.getBooking({
			userId: me.appUserId,
			bookingId: id,
		});
	} catch {
		notFound();
	}

	if (!booking) {
		notFound();
	}

	return (
		<div className="container mx-auto px-4 py-8">
			{/* Header */}
			<div className="mb-6">
				<Button asChild className="mb-4" size="sm" variant="ghost">
					<Link href="/bookings">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Bookings
					</Link>
				</Button>

				<div className="flex items-start justify-between">
					<div>
						<h1 className="font-bold text-3xl">Booking Details</h1>
						<p className="mt-2 text-gray-600">
							Reference: {booking.referenceNumber}
						</p>
					</div>
					<div className="flex items-center gap-3">
						<Badge
							className={
								statusColors[booking.status as keyof typeof statusColors]
							}
							variant="secondary"
						>
							{statusLabels[booking.status as keyof typeof statusLabels]}
						</Badge>
						{(booking.status === "draft" ||
							booking.status === "revision_requested") && (
							<Button asChild>
								<Link href={`/bookings/${booking.id}/edit`}>
									Continue Editing
								</Link>
							</Button>
						)}
					</div>
				</div>
			</div>

			{/* Status Messages */}
			{booking.status === "revision_requested" && booking.reviewNotes && (
				<Alert className="mb-6 border-amber-200 bg-amber-50">
					<AlertCircle className="h-4 w-4 text-amber-600" />
					<AlertDescription className="text-amber-900">
						<div>
							<p className="font-semibold">Revision Requested</p>
							<p className="mt-1 text-sm">{booking.reviewNotes}</p>
							<p className="mt-2 text-sm">
								Please edit your booking to address the comments above.
							</p>
						</div>
					</AlertDescription>
				</Alert>
			)}

			{booking.status === "rejected" && booking.reviewNotes && (
				<Alert className="mb-6 border-red-200 bg-red-50" variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						<div>
							<p className="font-semibold">Booking Rejected</p>
							<p className="mt-1 text-sm">{booking.reviewNotes}</p>
						</div>
					</AlertDescription>
				</Alert>
			)}

			{booking.status === "pending_user_verification" && (
				<Alert className="mb-6 border-yellow-200 bg-yellow-50">
					<AlertCircle className="h-4 w-4 text-yellow-600" />
					<AlertDescription className="text-yellow-800">
						Your account needs verification before this booking can be approved.
					</AlertDescription>
				</Alert>
			)}

			{/* Overview */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Booking Overview</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<div>
							<p className="font-medium text-gray-500 text-sm">Total Amount</p>
							<p className="mt-1 font-bold text-2xl">
								RM {booking.totalAmount.toFixed(2)}
							</p>
						</div>
						<div>
							<p className="font-medium text-gray-500 text-sm">Created On</p>
							<p className="mt-1 text-lg">
								{new Date(booking.createdAt).toLocaleDateString("en-US", {
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</p>
						</div>
					</div>

					{booking.projectDescription && (
						<div>
							<p className="font-medium text-gray-500 text-sm">
								Project Description
							</p>
							<p className="mt-1">{booking.projectDescription}</p>
						</div>
					)}

					{booking.notes && (
						<div>
							<p className="font-medium text-gray-500 text-sm">Notes</p>
							<p className="mt-1">{booking.notes}</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Service Items */}
			{booking.serviceItems && booking.serviceItems.length > 0 && (
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Service Items</CardTitle>
						<CardDescription>
							Requested analysis services and samples
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{booking.serviceItems.map((item, index) => (
								<div
									className="rounded-lg border p-4"
									key={item.id ?? `service-${index}`}
								>
									<div className="mb-2 flex items-start justify-between">
										<div>
											<h3 className="font-semibold">
												{item.service?.name ?? "Service"}
											</h3>
											{item.sampleName && (
												<p className="text-gray-600 text-sm">
													Sample: {item.sampleName}
												</p>
											)}
										</div>
										<div className="text-right">
											<p className="text-gray-500 text-sm">
												Quantity: {item.quantity}
											</p>
											<p className="font-semibold">
												RM {item.totalPrice.toFixed(2)}
											</p>
										</div>
									</div>
									{item.sampleDetails && (
										<p className="mt-2 text-gray-600 text-sm">
											{item.sampleDetails}
										</p>
									)}
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Workspace Bookings */}
			{booking.workspaceBookings && booking.workspaceBookings.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Workspace Bookings</CardTitle>
						<CardDescription>Requested workspace reservations</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{booking.workspaceBookings.map((workspace, index) => (
								<div
									className="rounded-lg border p-4"
									key={workspace.id ?? `workspace-${index}`}
								>
									<div className="flex items-start justify-between">
										<div>
											<p className="font-semibold">Workspace Rental</p>
											<p className="mt-1 text-gray-600 text-sm">
												{new Date(workspace.startDate).toLocaleDateString()} -{" "}
												{new Date(workspace.endDate).toLocaleDateString()}
											</p>
										</div>
									</div>
									{workspace.notes && (
										<p className="mt-2 text-gray-600 text-sm">
											{workspace.notes}
										</p>
									)}
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
