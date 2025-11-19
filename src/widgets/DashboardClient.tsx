"use client";

import {
	Bell,
	BookOpen,
	Calendar,
	CreditCard,
	FileText,
	FlaskConical,
	Plus,
} from "lucide-react";
import { useBookingStatusCounts } from "@/entities/booking/api";
import { DashboardBookingsWidget } from "@/features/bookings/list/widgets/DashboardBookingsWidget";
import RouterButton from "@/shared/ui/router-button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/shadcn/select";
import { UserSampleTracker } from "@/widgets/user-sample-tracker";

interface DashboardClientProps {
	userId: string;
}

export function DashboardClient({ userId }: DashboardClientProps) {
	// Fetch real counts
	const { data: counts } = useBookingStatusCounts({
		type: "all",
	});

	const totalBookings = counts?.all ?? 0;
	const inProgress = counts?.in_progress ?? 0;
	const completed = counts?.completed ?? 0;
	const pendingPayment = 0; // TODO: Implement when payment system is ready

	const notifications = [
		"Booking #BK003 results are ready for download",
		"Payment reminder for Booking #BK001",
		"Booking #BK002 has been approved",
		"New service available: Mass Spectrometry",
		"Maintenance scheduled for Lab A on Jan 25",
	];

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
					{/* Sidebar */}
					<div className="lg:col-span-1">
						<Card className="border-0 shadow-sm">
							<CardHeader className="pb-4">
								<CardTitle className="font-semibold text-gray-900 text-lg">
									Quick Actions
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<RouterButton
									className="w-full justify-start bg-blue-600 text-white hover:bg-blue-700"
									href="/services"
									variant="default"
								>
									<BookOpen className="mr-2 h-4 w-4" />
									Browse Services
								</RouterButton>
								<RouterButton
									className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50"
									href="/bookings/new"
									variant="outline"
								>
									<Plus className="mr-2 h-4 w-4" />
									New Booking Request
								</RouterButton>
								<RouterButton
									className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50"
									href="/bookings"
									variant="outline"
								>
									<FileText className="mr-2 h-4 w-4" />
									View All My Bookings
								</RouterButton>
							</CardContent>
						</Card>

						<Card className="mt-6 border-0 shadow-sm">
							<CardHeader className="pb-4">
								<CardTitle className="font-semibold text-gray-900 text-lg">
									Filters
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<label
										className="mb-2 block font-medium text-gray-700 text-sm"
										htmlFor="service-category"
									>
										Service Category
									</label>
									<Select>
										<SelectTrigger
											className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
											id="service-category"
										>
											<SelectValue placeholder="All Categories" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Categories</SelectItem>
											<SelectItem value="analysis">
												Analysis Services
											</SelectItem>
											<SelectItem value="workspace">Working Space</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div>
									<label
										className="mb-2 block font-medium text-gray-700 text-sm"
										htmlFor="booking-status"
									>
										Booking Status
									</label>
									<Select defaultValue="all">
										<SelectTrigger
											className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
											id="booking-status"
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Status</SelectItem>
											<SelectItem value="draft">Draft</SelectItem>
											<SelectItem value="pending">Pending</SelectItem>
											<SelectItem value="approved">Approved</SelectItem>
											<SelectItem value="in-progress">In Progress</SelectItem>
											<SelectItem value="completed">Completed</SelectItem>
											<SelectItem value="rejected">Rejected</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Main Content */}
					<div className="space-y-6 lg:col-span-3">
						{/* Welcome Section */}
						<div className="rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-white">
							<h2 className="mb-2 font-bold text-2xl">Welcome back!</h2>
							<p className="text-blue-100">
								You have {totalBookings} total bookings
								{inProgress > 0 && ` with ${inProgress} in progress`}.
							</p>
						</div>

						{/* Quick Stats */}
						<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
							<Card>
								<CardContent className="p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-gray-600 text-sm">Total Bookings</p>
											<p className="font-bold text-2xl">{totalBookings}</p>
										</div>
										<FileText className="h-8 w-8 text-blue-500" />
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-gray-600 text-sm">In Progress</p>
											<p className="font-bold text-2xl">{inProgress}</p>
										</div>
										<Calendar className="h-8 w-8 text-orange-500" />
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-gray-600 text-sm">Completed</p>
											<p className="font-bold text-2xl">{completed}</p>
										</div>
										<FlaskConical className="h-8 w-8 text-green-500" />
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-gray-600 text-sm">Pending Payment</p>
											<p className="font-bold text-2xl">{pendingPayment}</p>
										</div>
										<CreditCard className="h-8 w-8 text-red-500" />
									</div>
								</CardContent>
							</Card>
						</div>

						{/* My Bookings Widgets */}
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
							<DashboardBookingsWidget
								limit={5}
								preset="pending_review"
								showViewAll
								title="Pending Review"
							/>
							<DashboardBookingsWidget
								limit={5}
								preset="in_progress"
								showViewAll
								title="In Progress"
							/>
						</div>

						{/* Sample Tracker Widget */}
						<UserSampleTracker userId={userId} />

						<DashboardBookingsWidget
							limit={8}
							preset="recent_completed"
							showViewAll
							title="Recently Completed"
						/>

						{/* Recent Notifications - TODO: Implement when notifications are ready */}
						<Card>
							<CardHeader>
								<CardTitle>Recent Notifications</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{notifications.slice(0, 5).map((notification) => (
										<div
											className="flex items-start space-x-3 rounded-lg bg-gray-50 p-3"
											key={notification}
										>
											<Bell className="mt-0.5 h-4 w-4 text-blue-500" />
											<p className="text-gray-700 text-sm">{notification}</p>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
