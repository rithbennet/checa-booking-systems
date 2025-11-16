import { requireCurrentUser } from "@/shared/server/current-user";
import { db } from "@/shared/server/db";
import RouterButton from "@/shared/ui/router-button";
import { Badge } from "@/shared/ui/shadcn/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/shadcn/table";

const statusColors = {
	draft: "bg-gray-100 text-gray-800",
	pending_user_verification: "bg-yellow-100 text-yellow-800",
	pending_approval: "bg-blue-100 text-blue-800",
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
	approved: "Approved",
	rejected: "Rejected",
	in_progress: "In Progress",
	completed: "Completed",
	cancelled: "Cancelled",
};

export default async function BookingsPage() {
	const me = await requireCurrentUser();

	const bookings = await db.bookingRequest.findMany({
		where: {
			userId: me.appUserId,
		},
		orderBy: {
			createdAt: "desc",
		},
		select: {
			id: true,
			referenceNumber: true,
			status: true,
			totalAmount: true,
			createdAt: true,
			projectDescription: true,
		},
	});

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">My Bookings</h1>
					<p className="mt-2 text-gray-600">
						View and manage your lab service bookings
					</p>
				</div>
				<RouterButton href="/bookings/new">New Booking</RouterButton>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Booking Requests</CardTitle>
					<CardDescription>
						All your booking requests and their current status
					</CardDescription>
				</CardHeader>
				<CardContent>
					{bookings.length === 0 ? (
						<div className="py-12 text-center">
							<p className="text-gray-500">No bookings yet</p>
							<RouterButton
								className="mt-4"
								href="/bookings/new"
								variant="outline"
							>
								Create your first booking
							</RouterButton>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Reference</TableHead>
									<TableHead>Project</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Amount</TableHead>
									<TableHead>Created</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{bookings.map((booking) => (
									<TableRow key={booking.id}>
										<TableCell className="font-medium">
											{booking.referenceNumber}
										</TableCell>
										<TableCell>
											{booking.projectDescription ? (
												<span className="line-clamp-1">
													{booking.projectDescription}
												</span>
											) : (
												<span className="text-gray-400">No description</span>
											)}
										</TableCell>
										<TableCell>
											<Badge
												className={
													statusColors[
													booking.status as keyof typeof statusColors
													]
												}
												variant="secondary"
											>
												{
													statusLabels[
													booking.status as keyof typeof statusLabels
													]
												}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											RM {booking.totalAmount.toFixed(2)}
										</TableCell>
										<TableCell>
											{new Date(booking.createdAt).toLocaleDateString()}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												<RouterButton
													href={`/bookings/${booking.id}`}
													size="sm"
													variant="outline"
												>
													View
												</RouterButton>
												{booking.status === "draft" && (
													<RouterButton
														href={`/bookings/${booking.id}/edit`}
														size="sm"
													>
														Edit
													</RouterButton>
												)}
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
