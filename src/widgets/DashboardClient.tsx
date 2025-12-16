"use client";

import { formatDistanceToNow } from "date-fns";
import {
	Bell,
	BookOpen,
	Calendar,
	CreditCard,
	FileText,
	FlaskConical,
	Plus,
} from "lucide-react";
import Link from "next/link";
import { useBookingStatusCounts } from "@/entities/booking/api";
import { useUserFinancials } from "@/entities/booking/api/useUserFinancials";
import { useNotifications } from "@/entities/notification/api";
import type { NotificationVM } from "@/entities/notification/model/types";
import { buildHref } from "@/features/bookings/user/list/model/list.routes";
import type { FiltersState } from "@/features/bookings/user/list/model/filters.schema";
import { DashboardBookingsWidget } from "@/features/bookings/user/list/widgets/DashboardBookingsWidget";
import { cn } from "@/shared/lib/utils";
import RouterButton from "@/shared/ui/router-button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import { UserSampleTracker } from "@/widgets/user-sample-tracker";

// Filter presets for booking list links
const FILTER_PRESETS = {
	inProgress: {
		page: 1,
		pageSize: 25,
		sort: "updated_at:desc" as const,
		q: "",
		type: "all" as const,
		status: ["in_progress"],
	} satisfies FiltersState,
	completed: {
		page: 1,
		pageSize: 25,
		sort: "updated_at:desc" as const,
		q: "",
		type: "all" as const,
		status: ["completed"],
	} satisfies FiltersState,
	pendingReview: {
		page: 1,
		pageSize: 25,
		sort: "created_at:asc" as const,
		q: "",
		type: "all" as const,
		status: ["pending_user_verification", "pending_approval"],
	} satisfies FiltersState,
} as const;

// Helper function to get notification link
function getNotificationLink(notification: NotificationVM): string | null {
	if (!notification.relatedEntityId) return null;

	switch (notification.relatedEntityType) {
		case "booking":
			return `/bookings/${notification.relatedEntityId}`;
		case "user":
			return "/profile";
		case "sample":
			return "/samples";
		case "invoice":
		case "payment":
			return "/financials";
		default:
			return null;
	}
}

// Helper function to get notification color
function getNotificationColor(type: NotificationVM["type"]): string {
	switch (type) {
		case "booking_approved":
		case "payment_verified":
		case "results_available":
		case "process_complete":
			return "text-green-600";
		case "booking_rejected":
			return "text-red-600";
		case "booking_submitted":
		case "booking_pending_verification":
			return "text-blue-600";
		case "service_modification_requested":
		case "payment_reminder":
			return "text-amber-600";
		case "invoice_uploaded":
		case "service_form_ready":
		case "forms_signed_uploaded":
			return "text-purple-600";
		case "sample_return_requested":
		case "sample_returned":
			return "text-cyan-600";
		default:
			return "text-gray-600";
	}
}

export function DashboardClient() {
	// Fetch real counts
	const { data: counts } = useBookingStatusCounts({
		type: "all",
	});

	const totalBookings = counts?.all ?? 0;
	const inProgress = counts?.in_progress ?? 0;
	const completed = counts?.completed ?? 0;

	// Fetch financial data to get pending payment count
	const { data: financialsData } = useUserFinancials();

	// Derive pending payment count from financials data
	const pendingPayment =
		financialsData?.items.filter(
			(item) => item.paymentStatus === "pending_verification",
		).length ?? 0;

	// Fetch real notifications
	const { data: notificationsData, isLoading: isLoadingNotifications } =
		useNotifications();
	const recentNotifications = notificationsData?.items.slice(0, 5) ?? [];
	const unreadCount = notificationsData?.unreadCount ?? 0;

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
							<CardContent className="flex flex-col gap-3">
								<RouterButton
									className="w-full justify-start bg-blue-600 text-white hover:bg-blue-700"
									href="/services"
									variant="default"
								>
									<BookOpen className="mr-2 h-4 w-4 shrink-0" />
									<span className="truncate">Browse Services</span>
								</RouterButton>
								<RouterButton
									className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50"
									href="/bookings/new"
									variant="outline"
								>
									<Plus className="mr-2 h-4 w-4 shrink-0" />
									<span className="truncate">New Booking Request</span>
								</RouterButton>
								<RouterButton
									className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50"
									href="/bookings"
									variant="outline"
								>
									<FileText className="mr-2 h-4 w-4 shrink-0" />
									<span className="truncate">View All My Bookings</span>
								</RouterButton>
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
							<Link href="/bookings">
								<Card className="cursor-pointer transition-shadow hover:shadow-md">
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
							</Link>
							<Link href={buildHref("/bookings", FILTER_PRESETS.inProgress)}>
								<Card className="cursor-pointer transition-shadow hover:shadow-md">
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
							</Link>
							<Link href={buildHref("/bookings", FILTER_PRESETS.completed)}>
								<Card className="cursor-pointer transition-shadow hover:shadow-md">
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
							</Link>
							<Link href="/financials">
								<Card className="cursor-pointer transition-shadow hover:shadow-md">
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
							</Link>
						</div>

						{/* My Bookings Widgets */}
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
							<Link
								className="block"
								href={buildHref("/bookings", FILTER_PRESETS.pendingReview)}
							>
								<div className="cursor-pointer transition-opacity hover:opacity-90">
									<DashboardBookingsWidget
										limit={5}
										preset="pending_review"
										showViewAll
										title="Pending Review"
									/>
								</div>
							</Link>
							<Link
								className="block"
								href={buildHref("/bookings", FILTER_PRESETS.inProgress)}
							>
								<div className="cursor-pointer transition-opacity hover:opacity-90">
									<DashboardBookingsWidget
										limit={5}
										preset="in_progress"
										showViewAll
										title="In Progress"
									/>
								</div>
							</Link>
						</div>

						{/* Sample Tracker Widget */}
						<UserSampleTracker />

						<Link
							className="block"
							href={buildHref("/bookings", FILTER_PRESETS.completed)}
						>
							<div className="cursor-pointer transition-opacity hover:opacity-90">
								<DashboardBookingsWidget
									limit={8}
									preset="recent_completed"
									showViewAll
									title="Recently Completed"
								/>
							</div>
						</Link>

						{/* Recent Notifications */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div className="flex items-center gap-2">
									<CardTitle>Recent Notifications</CardTitle>
									{unreadCount > 0 && (
										<span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 font-medium text-white text-xs">
											{unreadCount > 9 ? "9+" : unreadCount}
										</span>
									)}
								</div>
								<Link
									className="text-blue-600 text-sm hover:underline"
									href="/notifications"
								>
									View all →
								</Link>
							</CardHeader>
							<CardContent>
								{isLoadingNotifications ? (
									<div className="flex items-center justify-center py-6">
										<div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
									</div>
								) : recentNotifications.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-6">
										<Bell className="mb-2 h-8 w-8 text-gray-300" />
										<p className="text-gray-500 text-sm">No notifications</p>
									</div>
								) : (
									<div className="space-y-3">
										{recentNotifications.map((notification) => {
											const link = getNotificationLink(notification);
											const colorClass = getNotificationColor(
												notification.type,
											);

											const content = (
												<div
													className={cn(
														"flex items-start gap-3 rounded-lg p-3 transition-colors",
														notification.isRead
															? "bg-gray-50"
															: "bg-blue-50/50",
													)}
												>
													<Bell
														className={cn(
															"mt-0.5 h-4 w-4 shrink-0",
															colorClass,
														)}
													/>
													<div className="min-w-0 flex-1">
														<div className="flex items-start justify-between gap-2">
															<p
																className={cn(
																	"text-sm",
																	notification.isRead
																		? "font-normal text-gray-700"
																		: "font-medium text-gray-900",
																)}
															>
																{notification.title}
															</p>
															{!notification.isRead && (
																<span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
															)}
														</div>
														<p className="mt-1 line-clamp-1 text-gray-500 text-sm">
															{notification.message}
														</p>
														<p className="mt-1 text-gray-400 text-xs">
															{formatDistanceToNow(
																new Date(notification.createdAt),
																{ addSuffix: true },
															)}
														</p>
													</div>
												</div>
											);

											if (link) {
												return (
													<Link
														className="block"
														href={link}
														key={notification.id}
													>
														{content}
													</Link>
												);
											}

											return <div key={notification.id}>{content}</div>;
										})}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
