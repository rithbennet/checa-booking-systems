"use client";

import { CheckCircle, Clock, Search, TestTube } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/ui/shadcn/dialog";
import { Input } from "@/shared/ui/shadcn/input";
import {
	Select,
	SelectContent,
	SelectGroup,
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

export default function SampleStatusManagement() {
	const [selectedStatus, setSelectedStatus] = useState("all");

	// Sample data - In a real app, this would come from your database
	const samples = [
		{
			id: "S001",
			bookingRef: "BK123",
			customerName: "John Smith",
			service: "FTIR Spectroscopy - KBr",
			dateReceived: "2025-06-20",
			status: "received",
		},
		{
			id: "S002",
			bookingRef: "BK124",
			customerName: "Sarah Johnson",
			service: "UV-Vis Spectroscopy - Absorbance/Transmittance",
			dateReceived: "2025-06-21",
			status: "in_analysis",
		},
		{
			id: "S003",
			bookingRef: "BK125",
			customerName: "Michael Wong",
			service: "Surface Area and Pore Analyzer (BET)",
			dateReceived: "2025-06-22",
			status: "completed",
		},
		// Add more sample data as needed
	];

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "received":
				return <Badge className="bg-blue-500">Received</Badge>;
			case "in_analysis":
				return <Badge className="bg-orange-500">In Analysis</Badge>;
			case "completed":
				return <Badge className="bg-green-500">Completed</Badge>;
			default:
				return <Badge>Unknown</Badge>;
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center space-x-4">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
						<TestTube className="h-5 w-5 text-white" />
					</div>
					<div>
						<h1 className="font-bold text-2xl text-gray-900">
							Sample Status Management
						</h1>
						<p className="text-gray-600 text-sm">
							Track and update sample statuses
						</p>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<Card>
				<CardHeader>
					<CardTitle className="text-xl">Sample Status Overview</CardTitle>
				</CardHeader>
				<CardContent>
					{/* Filters */}
					<div className="mb-6 flex items-center space-x-4">
						<div className="flex-1">
							<div className="relative">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-500" />
								<Input
									className="pl-10"
									placeholder="Search by Sample ID, Booking Ref, or Customer Name"
								/>
							</div>
						</div>
						<div className="w-48">
							<Select onValueChange={setSelectedStatus} value={selectedStatus}>
								<SelectTrigger>
									<SelectValue placeholder="Filter by Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem value="all">All Statuses</SelectItem>
										<SelectItem value="received">Received</SelectItem>
										<SelectItem value="in_analysis">In Analysis</SelectItem>
										<SelectItem value="completed">Completed</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Table */}
					<div className="rounded-lg border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Sample ID</TableHead>
									<TableHead>Booking Ref</TableHead>
									<TableHead>Customer Name</TableHead>
									<TableHead>Service</TableHead>
									<TableHead>Date Received</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{samples.map((sample) => (
									<TableRow key={sample.id}>
										<TableCell className="font-medium">{sample.id}</TableCell>
										<TableCell>{sample.bookingRef}</TableCell>
										<TableCell>{sample.customerName}</TableCell>
										<TableCell>{sample.service}</TableCell>
										<TableCell>{sample.dateReceived}</TableCell>
										<TableCell>{getStatusBadge(sample.status)}</TableCell>
										<TableCell>
											<Dialog>
												<DialogTrigger asChild>
													<Button size="sm" variant="outline">
														Update Status
													</Button>
												</DialogTrigger>
												<DialogContent>
													<DialogHeader>
														<DialogTitle>Update Sample Status</DialogTitle>
														<DialogDescription>
															Update the status for sample {sample.id}
														</DialogDescription>
													</DialogHeader>
													<div className="space-y-4 py-4">
														<Select defaultValue={sample.status}>
															<SelectTrigger>
																<SelectValue placeholder="Select new status" />
															</SelectTrigger>
															<SelectContent>
																<SelectGroup>
																	<SelectItem value="received">
																		Received
																	</SelectItem>
																	<SelectItem value="in_analysis">
																		In Analysis
																	</SelectItem>
																	<SelectItem value="completed">
																		Completed
																	</SelectItem>
																</SelectGroup>
															</SelectContent>
														</Select>
														<Button className="w-full">Save Changes</Button>
													</div>
												</DialogContent>
											</Dialog>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			{/* Status Summary Cards */}
			<div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-600 text-sm">Received Samples</p>
								<p className="font-bold text-3xl text-blue-600">12</p>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
								<TestTube className="h-6 w-6 text-blue-600" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-600 text-sm">In Analysis</p>
								<p className="font-bold text-3xl text-orange-600">8</p>
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
								<p className="text-gray-600 text-sm">Completed</p>
								<p className="font-bold text-3xl text-green-600">15</p>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
								<CheckCircle className="h-6 w-6 text-green-600" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
