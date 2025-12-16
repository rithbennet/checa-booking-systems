"use client";

import {
	AlertTriangle,
	Bell,
	CheckCircle,
	Clock,
	CreditCard,
	FileText,
	FlaskConical,
	Loader2,
	LogOut,
	Settings,
	TestTube,
	TrendingUp,
	User,
	Users,
} from "lucide-react";
import Link from "next/link";
import {
	useAdminDashboardActivity,
	useAdminDashboardMetrics,
	useAdminDashboardStatus,
} from "@/entities/admin-dashboard/api";
import type { AdminDashboardActivityItemVM } from "@/entities/admin-dashboard/model/types";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";

function getActivityIcon(type: AdminDashboardActivityItemVM["type"]) {
	switch (type) {
		case "user":
			return Users;
		case "booking":
			return CheckCircle;
		case "payment":
			return CreditCard;
		case "sample":
			return TestTube;
		case "service":
			return FlaskConical;
		default:
			return FileText;
	}
}

export function AdminDashboard() {
	const {
		data: metrics,
		isLoading: metricsLoading,
		error: metricsError,
	} = useAdminDashboardMetrics();

	const {
		data: status,
		isLoading: statusLoading,
		error: statusError,
	} = useAdminDashboardStatus();

	const {
		data: activity,
		isLoading: activityLoading,
		error: activityError,
	} = useAdminDashboardActivity();

	// Show loading state if any critical data is loading
	const isLoading = metricsLoading || statusLoading || activityLoading;

	// Use default values if data is not available yet
	const metricsData = metrics || {
		pendingVerifications: 0,
		pendingApprovals: 0,
		overduePayments: 0,
		activeBookings: 0,
		completedThisMonth: 0,
		totalRevenue: 0,
	};

	const statusData = status || {
		bookingsByStatus: {
			pending: 0,
			approved: 0,
			inProgress: 0,
			completed: 0,
		},
		usersByType: {
			mjiit: 0,
			utm: 0,
			external: 0,
			pending: 0,
		},
		activeSamples: 0,
	};

	const activityData = activity || { items: [] };

	const adminActions = [
		{
			title: "Manage Users",
			description: "Review registrations, verify accounts, manage user roles",
			icon: Users,
			color: "bg-blue-500",
			notifications: metricsData.pendingVerifications,
			href: "/admin/users",
		},
		{
			title: "Manage Services",
			description: "Add, edit, and configure lab services and pricing",
			icon: FlaskConical,
			color: "bg-green-500",
			notifications: 0,
			href: "/admin/services",
		},
		{
			title: "Review Bookings",
			description: "Approve, reject, and manage booking requests",
			icon: FileText,
			color: "bg-orange-500",
			notifications: metricsData.pendingApprovals,
			href: "/admin/bookings",
		},
		{
			title: "Financial Management",
			description: "Handle invoicing, payments, and financial reports",
			icon: CreditCard,
			color: "bg-purple-500",
			notifications: metricsData.overduePayments,
			href: "/admin/finance",
		},
		{
			title: "Sample Tracking",
			description: "Track samples, update status, upload results",
			icon: TestTube,
			color: "bg-teal-500",
			notifications: statusData.activeSamples,
			href: "/admin/operations",
		},
		{
			title: "System Settings",
			description: "Configure system settings and generate reports",
			icon: Settings,
			color: "bg-gray-500",
			notifications: 0,
			href: "/admin/settings",
		},
	];

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Alert Banner */}
				{(metricsData.pendingVerifications > 0 ||
					metricsData.pendingApprovals > 0) && (
					<div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
						<div className="flex items-center">
							<AlertTriangle className="mr-3 h-5 w-5 text-yellow-600" />
							<div className="flex-1">
								<h3 className="font-medium text-sm text-yellow-800">
									Attention Required
								</h3>
								<p className="mt-1 text-sm text-yellow-700">
									You have {metricsData.pendingVerifications} pending user
									verifications and {metricsData.pendingApprovals} booking
									requests awaiting approval.
								</p>
							</div>
							<Button asChild className="ml-4" size="sm" variant="outline">
								<Link href="/admin/users">Review Now</Link>
							</Button>
						</div>
					</div>
				)}

				{/* Key Metrics */}
				<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardContent className="p-6">
							{isLoading ? (
								<div className="flex items-center justify-center py-4">
									<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
								</div>
							) : (
								<div className="flex items-center justify-between">
									<div>
										<p className="text-gray-600 text-sm">
											Pending Verifications
										</p>
										<p className="font-bold text-3xl text-red-600">
											{metricsData.pendingVerifications}
										</p>
									</div>
									<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
										<Users className="h-6 w-6 text-red-600" />
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6">
							{isLoading ? (
								<div className="flex items-center justify-center py-4">
									<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
								</div>
							) : (
								<div className="flex items-center justify-between">
									<div>
										<p className="text-gray-600 text-sm">Pending Approvals</p>
										<p className="font-bold text-3xl text-orange-600">
											{metricsData.pendingApprovals}
										</p>
									</div>
									<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
										<Clock className="h-6 w-6 text-orange-600" />
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6">
							{isLoading ? (
								<div className="flex items-center justify-center py-4">
									<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
								</div>
							) : (
								<div className="flex items-center justify-between">
									<div>
										<p className="text-gray-600 text-sm">Active Bookings</p>
										<p className="font-bold text-3xl text-blue-600">
											{metricsData.activeBookings}
										</p>
									</div>
									<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
										<FileText className="h-6 w-6 text-blue-600" />
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6">
							{isLoading ? (
								<div className="flex items-center justify-center py-4">
									<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
								</div>
							) : (
								<div className="flex items-center justify-between">
									<div>
										<p className="text-gray-600 text-sm">Monthly Revenue</p>
										<p className="font-bold text-3xl text-green-600">
											RM {metricsData.totalRevenue.toLocaleString()}
										</p>
									</div>
									<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
										<TrendingUp className="h-6 w-6 text-green-600" />
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
					{/* Administrative Actions */}
					<div className="lg:col-span-2">
						<Card>
							<CardHeader>
								<CardTitle className="text-xl">
									Administrative Actions
								</CardTitle>
								<CardDescription>
									Quick access to key management functions
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									{adminActions.map((action) => {
										const IconComponent = action.icon;
										return (
											<Link href={action.href} key={action.title}>
												<Card className="cursor-pointer transition-shadow hover:shadow-md">
													<CardContent className="p-4">
														<div className="flex items-start space-x-4">
															<div
																className={`h-10 w-10 ${action.color} flex items-center justify-center rounded-lg`}
															>
																<IconComponent className="h-5 w-5 text-white" />
															</div>
															<div className="flex-1">
																<div className="flex items-center justify-between">
																	<h3 className="font-medium text-gray-900">
																		{action.title}
																	</h3>
																	{action.notifications > 0 && (
																		<Badge
																			className="text-xs"
																			variant="destructive"
																		>
																			{action.notifications}
																		</Badge>
																	)}
																</div>
																<p className="mt-1 text-gray-600 text-sm">
																	{action.description}
																</p>
															</div>
														</div>
													</CardContent>
												</Card>
											</Link>
										);
									})}
								</div>
							</CardContent>
						</Card>

						{/* System Status Overview */}
						<Card className="mt-6">
							<CardHeader>
								<CardTitle className="text-xl">
									System Status Overview
								</CardTitle>
							</CardHeader>
							<CardContent>
								{statusLoading ? (
									<div className="flex items-center justify-center py-8">
										<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
									</div>
								) : statusError ? (
									<div className="py-8 text-center text-red-600 text-sm">
										Failed to load status data
									</div>
								) : (
									<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
										<div className="text-center">
											<h4 className="mb-2 font-medium text-gray-600 text-sm">
												Active Bookings by Status
											</h4>
											<div className="space-y-2">
												<div className="flex items-center justify-between text-sm">
													<span>Pending</span>
													<span className="font-medium">
														{statusData.bookingsByStatus.pending}
													</span>
												</div>
												<div className="flex items-center justify-between text-sm">
													<span>Approved</span>
													<span className="font-medium">
														{statusData.bookingsByStatus.approved}
													</span>
												</div>
												<div className="flex items-center justify-between text-sm">
													<span>In Progress</span>
													<span className="font-medium">
														{statusData.bookingsByStatus.inProgress}
													</span>
												</div>
												<div className="flex items-center justify-between text-sm">
													<span>Completed</span>
													<span className="font-medium">
														{statusData.bookingsByStatus.completed}
													</span>
												</div>
											</div>
										</div>

										<div className="text-center">
											<h4 className="mb-2 font-medium text-gray-600 text-sm">
												User Accounts by Type
											</h4>
											<div className="space-y-2">
												<div className="flex items-center justify-between text-sm">
													<span>MJIIT</span>
													<span className="font-medium">
														{statusData.usersByType.mjiit}
													</span>
												</div>
												<div className="flex items-center justify-between text-sm">
													<span>UTM</span>
													<span className="font-medium">
														{statusData.usersByType.utm}
													</span>
												</div>
												<div className="flex items-center justify-between text-sm">
													<span>External</span>
													<span className="font-medium">
														{statusData.usersByType.external}
													</span>
												</div>
												<div className="flex items-center justify-between text-sm">
													<span>Pending</span>
													<span className="font-medium text-orange-600">
														{statusData.usersByType.pending}
													</span>
												</div>
											</div>
										</div>

										<div className="text-center">
											<h4 className="mb-2 font-medium text-gray-600 text-sm">
												Active Samples
											</h4>
											<div className="mb-2 font-bold text-3xl text-blue-600">
												{statusData.activeSamples}
											</div>
											<p className="text-gray-500 text-xs">
												Currently in analysis
											</p>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Recent Activity */}
					<div className="lg:col-span-1">
						<Card>
							<CardHeader>
								<CardTitle className="text-xl">
									Recent System Activity
								</CardTitle>
							</CardHeader>
							<CardContent>
								{activityLoading ? (
									<div className="flex items-center justify-center py-8">
										<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
									</div>
								) : activityError ? (
									<div className="py-8 text-center text-red-600 text-sm">
										Failed to load activity
									</div>
								) : activityData.items.length === 0 ? (
									<div className="py-8 text-center text-gray-500 text-sm">
										No recent activity
									</div>
								) : (
									<div className="space-y-4">
										{activityData.items.map((activity) => {
											const IconComponent = getActivityIcon(activity.type);
											return (
												<div
													className="flex items-start space-x-3"
													key={activity.id}
												>
													<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
														<IconComponent className="h-4 w-4 text-gray-600" />
													</div>
													<div className="flex-1">
														<p className="text-gray-900 text-sm">
															{activity.action}
														</p>
														<p className="text-gray-500 text-xs">
															{activity.timestamp}
														</p>
													</div>
												</div>
											);
										})}
									</div>
								)}
								<Button className="mt-4 w-full" variant="outline">
									View All Activity
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
