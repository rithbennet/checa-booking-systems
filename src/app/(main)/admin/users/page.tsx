/** biome-ignore-all lint/suspicious/noExplicitAny: <temporart> */
"use client";

import {
	ArrowLeft,
	Bell,
	Calendar,
	CheckCircle,
	Eye,
	Filter,
	LogOut,
	MessageSquare,
	Search,
	Settings,
	User,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import { Checkbox } from "@/shared/ui/shadcn/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/shadcn/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/shadcn/table";
import { Textarea } from "@/shared/ui/shadcn/textarea";

export default function ManageUsers() {
	const [searchTerm, setSearchTerm] = useState("");
	const [userTypeFilter, setUserTypeFilter] = useState("all");
	const [selectedUser, setSelectedUser] = useState<any>(null);
	const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

	const pendingUsers = [
		{
			id: "USR001",
			name: "Ahmad Faiz bin Rahman",
			email: "ahmad.faiz@graduate.utm.my",
			userType: "MJIIT",
			registrationDate: "2024-01-20",
			faculty: "Faculty of Engineering",
			department: "Chemical Engineering",
			matricId: "MKE201234",
			phone: "+60123456789",
		},
		{
			id: "USR002",
			name: "Sarah Chen Wei Lin",
			email: "sarah.chen@utm.my",
			userType: "UTM",
			registrationDate: "2024-01-19",
			faculty: "Faculty of Science",
			department: "Chemistry",
			staffId: "UTM789456",
			phone: "+60198765432",
		},
		{
			id: "USR003",
			name: "Dr. Michael Johnson",
			email: "m.johnson@petronas.com",
			userType: "External",
			registrationDate: "2024-01-18",
			company: "PETRONAS Research Sdn Bhd",
			address:
				"Lot 3288 & 3289, Off Jalan Ayer Itam, Kawasan Institusi Bangi, 43000 Kajang, Selangor",
			contactPerson: "Dr. Michael Johnson - Senior Research Scientist",
			phone: "+60387654321",
		},
		{
			id: "USR004",
			name: "Nurul Aina binti Hassan",
			email: "nurul.aina@graduate.utm.my",
			userType: "MJIIT",
			registrationDate: "2024-01-17",
			faculty: "Faculty of Engineering",
			department: "Mechanical Engineering",
			matricId: "MME201567",
			phone: "+60134567890",
		},
		{
			id: "USR005",
			name: "Tech Solutions Sdn Bhd",
			email: "lab.services@techsolutions.my",
			userType: "External",
			registrationDate: "2024-01-16",
			company: "Tech Solutions Sdn Bhd",
			address:
				"Level 15, Menara Axiata, No. 9, Jalan Stesen Sentral 5, Kuala Lumpur Sentral, 50470 Kuala Lumpur",
			contactPerson: "Lim Wei Ming - Laboratory Manager",
			phone: "+60321234567",
		},
	];

	const filteredUsers = pendingUsers.filter((user) => {
		const matchesSearch =
			user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.email.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesType =
			userTypeFilter === "all" || user.userType === userTypeFilter;
		return matchesSearch && matchesType;
	});

	const handleReviewUser = (user: any) => {
		setSelectedUser(user);
		setReviewDialogOpen(true);
	};

	const handleApproveUser = () => {
		// Handle user approval logic
		setReviewDialogOpen(false);
		setSelectedUser(null);
	};

	const _handleRejectUser = () => {
		// Handle user rejection logic
		setReviewDialogOpen(false);
		setSelectedUser(null);
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="border-b bg-white shadow-sm">
				<div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-8">
							<div className="flex items-center space-x-4">
								<Button size="sm" variant="ghost">
									<ArrowLeft className="mr-2 h-4 w-4" />
									Back to Dashboard
								</Button>
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600">
									<Settings className="h-5 w-5 text-white" />
								</div>
								<div>
									<h1 className="font-bold text-gray-900 text-lg">
										User Management
									</h1>
									<p className="text-gray-600 text-xs">Pending Registrations</p>
								</div>
							</div>
						</div>
						<div className="flex items-center space-x-4">
							<Bell className="h-5 w-5 text-gray-600" />
							<div className="flex items-center space-x-2">
								<User className="h-5 w-5 text-gray-600" />
								<span className="font-medium text-sm">Admin User</span>
							</div>
							<Button size="sm" variant="ghost">
								<LogOut className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</header>

			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Page Header */}
				<div className="mb-8">
					<h2 className="font-bold text-2xl text-gray-900">
						Pending User Registrations
					</h2>
					<p className="text-gray-600">Review and approve new user accounts</p>
				</div>

				{/* Filters and Search */}
				<Card className="mb-6">
					<CardContent className="p-6">
						<div className="flex flex-col gap-4 md:flex-row">
							<div className="flex-1">
								<div className="relative">
									<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
									<Input
										className="pl-10"
										onChange={(e) => setSearchTerm(e.target.value)}
										placeholder="Search by name or email..."
										value={searchTerm}
									/>
								</div>
							</div>
							<div className="w-48">
								<Select
									onValueChange={setUserTypeFilter}
									value={userTypeFilter}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All User Types</SelectItem>
										<SelectItem value="MJIIT">MJIIT Members</SelectItem>
										<SelectItem value="UTM">UTM Members</SelectItem>
										<SelectItem value="External">External Clients</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<Button variant="outline">
								<Filter className="mr-2 h-4 w-4" />
								More Filters
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Users Table */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Pending User Registrations</CardTitle>
								<CardDescription>
									{filteredUsers.length} users awaiting review
								</CardDescription>
							</div>
							<div className="flex items-center space-x-2">
								<Button size="sm" variant="outline">
									<Checkbox className="mr-2" />
									Select All
								</Button>
								<Button size="sm" variant="outline">
									Bulk Actions
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-12">
										<Checkbox />
									</TableHead>
									<TableHead>Registration Date</TableHead>
									<TableHead>User Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>User Type</TableHead>
									<TableHead>Affiliation Details</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredUsers.map((user) => (
									<TableRow key={user.id}>
										<TableCell>
											<Checkbox />
										</TableCell>
										<TableCell>
											<div className="flex items-center space-x-2">
												<Calendar className="h-4 w-4 text-gray-400" />
												<span className="text-sm">{user.registrationDate}</span>
											</div>
										</TableCell>
										<TableCell>
											<div>
												<p className="font-medium">{user.name}</p>
												<p className="text-gray-500 text-sm">{user.phone}</p>
											</div>
										</TableCell>
										<TableCell>
											<span className="text-sm">{user.email}</span>
										</TableCell>
										<TableCell>
											<Badge
												className={
													user.userType === "MJIIT"
														? "bg-blue-100 text-blue-800"
														: user.userType === "UTM"
															? "bg-green-100 text-green-800"
															: "bg-orange-100 text-orange-800"
												}
												variant="secondary"
											>
												{user.userType}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="text-sm">
												{user.userType === "External" ? (
													<div>
														<p className="font-medium">{user.company}</p>
														<p className="text-gray-500">
															{user.contactPerson}
														</p>
													</div>
												) : (
													<div>
														<p className="font-medium">{user.faculty}</p>
														<p className="text-gray-500">{user.department}</p>
														<p className="text-gray-500">
															{user.matricId || user.staffId}
														</p>
													</div>
												)}
											</div>
										</TableCell>
										<TableCell>
											<Button
												onClick={() => handleReviewUser(user)}
												size="sm"
												variant="outline"
											>
												<Eye className="mr-2 h-4 w-4" />
												Review
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				{/* Review User Dialog */}
				<Dialog onOpenChange={setReviewDialogOpen} open={reviewDialogOpen}>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>Review User Account</DialogTitle>
							<DialogDescription>
								Review the user details and make a verification decision
							</DialogDescription>
						</DialogHeader>

						{selectedUser && (
							<div className="space-y-6">
								{/* User Details */}
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div>
										<Label className="font-medium text-gray-700 text-sm">
											Full Name
										</Label>
										<p className="mt-1 text-gray-900 text-sm">
											{selectedUser.name}
										</p>
									</div>
									<div>
										<Label className="font-medium text-gray-700 text-sm">
											Email Address
										</Label>
										<p className="mt-1 text-gray-900 text-sm">
											{selectedUser.email}
										</p>
									</div>
									<div>
										<Label className="font-medium text-gray-700 text-sm">
											Phone Number
										</Label>
										<p className="mt-1 text-gray-900 text-sm">
											{selectedUser.phone}
										</p>
									</div>
									<div>
										<Label className="font-medium text-gray-700 text-sm">
											User Type
										</Label>
										<Badge
											className={`mt-1 ${selectedUser.userType === "MJIIT"
												? "bg-blue-100 text-blue-800"
												: selectedUser.userType === "UTM"
													? "bg-green-100 text-green-800"
													: "bg-orange-100 text-orange-800"
												}`}
										>
											{selectedUser.userType}
										</Badge>
									</div>
									<div>
										<Label className="font-medium text-gray-700 text-sm">
											Registration Date
										</Label>
										<p className="mt-1 text-gray-900 text-sm">
											{selectedUser.registrationDate}
										</p>
									</div>
								</div>

								{/* Affiliation Details */}
								<div className="border-t pt-4">
									<h4 className="mb-3 font-medium text-gray-900">
										{selectedUser.userType === "External"
											? "Organizational Details"
											: "Institutional Details"}
									</h4>
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
										{selectedUser.userType === "External" ? (
											<>
												<div className="md:col-span-2">
													<Label className="font-medium text-gray-700 text-sm">
														Company/Institution
													</Label>
													<p className="mt-1 text-gray-900 text-sm">
														{selectedUser.company}
													</p>
												</div>
												<div className="md:col-span-2">
													<Label className="font-medium text-gray-700 text-sm">
														Address
													</Label>
													<p className="mt-1 text-gray-900 text-sm">
														{selectedUser.address}
													</p>
												</div>
												<div className="md:col-span-2">
													<Label className="font-medium text-gray-700 text-sm">
														Contact Person
													</Label>
													<p className="mt-1 text-gray-900 text-sm">
														{selectedUser.contactPerson}
													</p>
												</div>
											</>
										) : (
											<>
												<div>
													<Label className="font-medium text-gray-700 text-sm">
														Faculty
													</Label>
													<p className="mt-1 text-gray-900 text-sm">
														{selectedUser.faculty}
													</p>
												</div>
												<div>
													<Label className="font-medium text-gray-700 text-sm">
														Department
													</Label>
													<p className="mt-1 text-gray-900 text-sm">
														{selectedUser.department}
													</p>
												</div>
												<div>
													<Label className="font-medium text-gray-700 text-sm">
														{selectedUser.matricId
															? "Matric Number"
															: "Staff ID"}
													</Label>
													<p className="mt-1 text-gray-900 text-sm">
														{selectedUser.matricId || selectedUser.staffId}
													</p>
												</div>
											</>
										)}
									</div>
								</div>

								{/* Admin Notes */}
								<div className="border-t pt-4">
									<Label
										className="font-medium text-gray-700 text-sm"
										htmlFor="admin-notes"
									>
										Admin Notes (Optional)
									</Label>
									<Textarea
										className="mt-2"
										id="admin-notes"
										placeholder="Add any internal notes about this user verification..."
										rows={3}
									/>
								</div>

								{/* Action Buttons */}
								<div className="flex items-center justify-end space-x-3 border-t pt-4">
									<Button
										onClick={() => setReviewDialogOpen(false)}
										variant="outline"
									>
										Cancel
									</Button>
									<Button
										className="border-blue-600 text-blue-600 hover:bg-blue-50"
										variant="outline"
									>
										<MessageSquare className="mr-2 h-4 w-4" />
										Need More Info
									</Button>
									<Button
										className="border-red-600 text-red-600 hover:bg-red-50"
										variant="outline"
									>
										<XCircle className="mr-2 h-4 w-4" />
										Reject Account
									</Button>
									<Button
										className="bg-green-600 hover:bg-green-700"
										onClick={handleApproveUser}
									>
										<CheckCircle className="mr-2 h-4 w-4" />
										Approve Account
									</Button>
								</div>
							</div>
						)}
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
