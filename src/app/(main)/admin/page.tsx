"use client";

import {
	AlertTriangle,
	Bell,
	CheckCircle,
	Clock,
	CreditCard,
	FileText,
	FlaskConical,
	LogOut,
	Settings,
	TestTube,
	TrendingUp,
	User,
	Users,
} from "lucide-react";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";

export default function AdminDashboard() {
	const metrics = {
		pendingVerifications: 5,
		pendingApprovals: 12,
		overduePayments: 3,
		activeBookings: 28,
		completedThisMonth: 45,
		totalRevenue: 15750,
	};

	const adminActions = [
		{
			title: "Manage Users",
			description: "Review registrations, verify accounts, manage user roles",
			icon: Users,
			color: "bg-blue-500",
			notifications: metrics.pendingVerifications,
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
			notifications: metrics.pendingApprovals,
			href: "/admin/bookings",
		},
		{
			title: "Financial Management",
			description: "Handle invoicing, payments, and financial reports",
			icon: CreditCard,
			color: "bg-purple-500",
			notifications: metrics.overduePayments,
			href: "/admin/finance",
		},
		{
			title: "Sample Tracking",
			description: "Track samples, update status, upload results",
			icon: TestTube,
			color: "bg-teal-500",
			notifications: 8,
			href: "/admin/samples",
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

	const recentActivity = [
		{
			action: "User John Doe registered",
			timestamp: "2 minutes ago",
			type: "user",
			icon: Users,
		},
		{
			action: "Booking #BK123 approved by Admin",
			timestamp: "15 minutes ago",
			type: "booking",
			icon: CheckCircle,
		},
		{
			action: "Payment proof uploaded for #BK456",
			timestamp: "1 hour ago",
			type: "payment",
			icon: CreditCard,
		},
		{
			action: "Results uploaded for Sample #S789",
			timestamp: "2 hours ago",
			type: "sample",
			icon: TestTube,
		},
		{
			action: "New service 'Mass Spectrometry' added",
			timestamp: "3 hours ago",
			type: "service",
			icon: FlaskConical,
		},
	];

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="border-b bg-white shadow-sm">
				<div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-8">
							<div className="flex items-center space-x-4">
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600">
									<Settings className="h-5 w-5 text-white" />
								</div>
								<div>
									<h1 className="font-bold text-gray-900 text-lg">
										ChECA Lab Admin
									</h1>
									<p className="text-gray-600 text-xs">Management Portal</p>
								</div>
							</div>
							{/* Breadcrumb */}
							<nav className="flex items-center space-x-2 text-gray-500 text-sm">
								<span className="font-medium text-red-600">
									Administrator Dashboard
								</span>
							</nav>
						</div>
						<div className="flex items-center space-x-4">
							<div className="flex items-center space-x-2">
								<div className="relative">
									<Bell className="h-5 w-5 text-gray-600" />
									<span className="-top-1 -right-1 absolute h-3 w-3 rounded-full bg-red-500"></span>
								</div>
								<span className="text-gray-600 text-sm">5 alerts</span>
							</div>
							<div className="flex items-center space-x-2">
								<User className="h-5 w-5 text-gray-600" />
								<span className="font-medium text-sm">Admin User</span>
								<span className="rounded bg-red-50 px-2 py-1 text-gray-500 text-xs">
									Administrator
								</span>
							</div>
							<Button size="sm" variant="ghost">
								<LogOut className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</header>

			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Alert Banner */}
				<div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
					<div className="flex items-center">
						<AlertTriangle className="mr-3 h-5 w-5 text-yellow-600" />
						<div className="flex-1">
							<h3 className="font-medium text-sm text-yellow-800">
								Attention Required
							</h3>
							<p className="mt-1 text-sm text-yellow-700">
								You have {metrics.pendingVerifications} pending user
								verifications and {metrics.pendingApprovals} booking requests
								awaiting approval.
							</p>
						</div>
						<Button className="ml-4" size="sm" variant="outline">
							Review Now
						</Button>
					</div>
				</div>

				{/* Key Metrics */}
				<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-gray-600 text-sm">Pending Verifications</p>
									<p className="font-bold text-3xl text-red-600">
										{metrics.pendingVerifications}
									</p>
								</div>
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
									<Users className="h-6 w-6 text-red-600" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-gray-600 text-sm">Pending Approvals</p>
									<p className="font-bold text-3xl text-orange-600">
										{metrics.pendingApprovals}
									</p>
								</div>
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
									<Clock className="h-6 w-6 text-orange-600" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-gray-600 text-sm">Active Bookings</p>
									<p className="font-bold text-3xl text-blue-600">
										{metrics.activeBookings}
									</p>
								</div>
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
									<FileText className="h-6 w-6 text-blue-600" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-gray-600 text-sm">Monthly Revenue</p>
									<p className="font-bold text-3xl text-green-600">
										RM {metrics.totalRevenue.toLocaleString()}
									</p>
								</div>
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
									<TrendingUp className="h-6 w-6 text-green-600" />
								</div>
							</div>
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
											<Card
												className="cursor-pointer transition-shadow hover:shadow-md"
												key={action.title}
											>
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
								<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
									<div className="text-center">
										<h4 className="mb-2 font-medium text-gray-600 text-sm">
											Active Bookings by Status
										</h4>
										<div className="space-y-2">
											<div className="flex items-center justify-between text-sm">
												<span>Pending</span>
												<span className="font-medium">12</span>
											</div>
											<div className="flex items-center justify-between text-sm">
												<span>Approved</span>
												<span className="font-medium">8</span>
											</div>
											<div className="flex items-center justify-between text-sm">
												<span>In Progress</span>
												<span className="font-medium">5</span>
											</div>
											<div className="flex items-center justify-between text-sm">
												<span>Completed</span>
												<span className="font-medium">3</span>
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
												<span className="font-medium">45</span>
											</div>
											<div className="flex items-center justify-between text-sm">
												<span>UTM</span>
												<span className="font-medium">32</span>
											</div>
											<div className="flex items-center justify-between text-sm">
												<span>External</span>
												<span className="font-medium">18</span>
											</div>
											<div className="flex items-center justify-between text-sm">
												<span>Pending</span>
												<span className="font-medium text-orange-600">5</span>
											</div>
										</div>
									</div>

									<div className="text-center">
										<h4 className="mb-2 font-medium text-gray-600 text-sm">
											Active Samples
										</h4>
										<div className="mb-2 font-bold text-3xl text-blue-600">
											24
										</div>
										<p className="text-gray-500 text-xs">
											Currently in analysis
										</p>
									</div>
								</div>
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
								<div className="space-y-4">
									{recentActivity.map((activity) => {
										const IconComponent = activity.icon;
										return (
											<div
												className="flex items-start space-x-3"
												key={`${activity.action}-${activity.timestamp}`}
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
