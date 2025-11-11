"use client";

import { ClipboardList, Download, FileText, Search, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import { Checkbox } from "@/shared/ui/shadcn/checkbox";
import { Input } from "@/shared/ui/shadcn/input";
import { Separator } from "@/shared/ui/shadcn/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/shadcn/table";

export default function GenerateServiceForms() {
	const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
	const [selectedForms, setSelectedForms] = useState<string[]>([]);

	// Sample data - In a real app, this would come from your database
	const completedBookings = [
		{
			id: "BK789",
			customerName: "Dr. Sarah Johnson",
			completionDate: "2025-06-20",
			services: [
				"FTIR Spectroscopy - KBr",
				"UV-Vis Spectroscopy - Absorbance/Transmittance",
			],
		},
		{
			id: "BK790",
			customerName: "Prof. Michael Wong",
			completionDate: "2025-06-21",
			services: ["Surface Area and Pore Analyzer (BET)"],
		},
		{
			id: "BK791",
			customerName: "Dr. Emily Chen",
			completionDate: "2025-06-22",
			services: ["Surface Area and Pore Analyzer (BET)"],
		},
	];

	const availableForms = [
		{
			id: "service-form",
			label: "Service Form",
			description: "Standard service completion documentation",
		},
		{
			id: "work-area",
			label: "Working Area Agreement",
			description: "Laboratory space usage terms",
		},
	];

	const handleFormSelection = (formId: string) => {
		setSelectedForms((prev) =>
			prev.includes(formId)
				? prev.filter((id) => id !== formId)
				: [...prev, formId],
		);
	};

	const getBookingById = (id: string) => {
		return completedBookings.find((booking) => booking.id === id);
	};

	const handleGenerateForms = () => {
		// This would connect to your backend to generate the selected forms
		console.log("Generating forms for booking:", selectedBooking);
		console.log("Selected forms:", selectedForms);
	};

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center space-x-4">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
						<FileText className="h-5 w-5 text-white" />
					</div>
					<div>
						<h1 className="font-bold text-2xl text-gray-900">
							Generate Service Forms
						</h1>
						<p className="text-gray-600 text-sm">
							Create and manage service documentation
						</p>
					</div>
				</div>
			</div>

			<div className="flex gap-6">
				{/* Main Content */}
				<div className="flex-1">
					<Card>
						<CardHeader>
							<CardTitle className="text-xl">Completed Bookings</CardTitle>
						</CardHeader>
						<CardContent>
							{/* Search */}
							<div className="mb-6">
								<div className="relative">
									<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-500" />
									<Input
										className="pl-10"
										placeholder="Search by Booking ID or Customer Name"
									/>
								</div>
							</div>

							{/* Table */}
							<div className="rounded-lg border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Booking ID</TableHead>
											<TableHead>Customer Name</TableHead>
											<TableHead>Completion Date</TableHead>
											<TableHead>Services Rendered</TableHead>
											<TableHead>Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{completedBookings.map((booking) => (
											<TableRow
												className={
													selectedBooking === booking.id ? "bg-indigo-50" : ""
												}
												key={booking.id}
											>
												<TableCell className="font-medium">
													{booking.id}
												</TableCell>
												<TableCell>{booking.customerName}</TableCell>
												<TableCell>{booking.completionDate}</TableCell>
												<TableCell>
													<div className="flex flex-col gap-1">
														{booking.services.map((service) => (
															<Badge
																className="w-fit"
																key={service}
																variant="secondary"
															>
																{service}
															</Badge>
														))}
													</div>
												</TableCell>
												<TableCell>
													<Button
														onClick={() => setSelectedBooking(booking.id)}
														size="sm"
														variant={
															selectedBooking === booking.id
																? "secondary"
																: "outline"
														}
													>
														<ClipboardList className="mr-2 h-4 w-4" />
														Select Forms
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Side Panel */}
				{selectedBooking && (
					<div className="w-96">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-xl">Form Selection</CardTitle>
								<Button
									onClick={() => setSelectedBooking(null)}
									size="icon"
									variant="ghost"
								>
									<X className="h-4 w-4" />
								</Button>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{/* Booking Summary */}
									<div>
										<h3 className="font-medium text-gray-500 text-sm">
											Booking Summary
										</h3>
										<div className="mt-2 space-y-2">
											<p className="text-sm">
												<span className="font-medium">Booking ID:</span>{" "}
												{selectedBooking}
											</p>
											<p className="text-sm">
												<span className="font-medium">Customer:</span>{" "}
												{getBookingById(selectedBooking)?.customerName}
											</p>
											<p className="text-sm">
												<span className="font-medium">Services:</span>
											</p>
											<div className="ml-2">
												{getBookingById(selectedBooking)?.services.map(
													(service) => (
														<p className="text-gray-600 text-sm" key={service}>
															• {service}
														</p>
													),
												)}
											</div>
										</div>
									</div>

									<Separator />

									{/* Form Selection */}
									<div>
										<h3 className="mb-3 font-medium text-gray-500 text-sm">
											Select Forms to Generate
										</h3>
										<div className="space-y-4">
											{availableForms.map((form) => (
												<div
													className="flex items-start space-x-3"
													key={form.id}
												>
													<Checkbox
														checked={selectedForms.includes(form.id)}
														id={form.id}
														onCheckedChange={() => handleFormSelection(form.id)}
													/>
													<div className="grid gap-1.5 leading-none">
														<label
															className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
															htmlFor={form.id}
														>
															{form.label}
														</label>
														<p className="text-gray-500 text-sm">
															{form.description}
														</p>
													</div>
												</div>
											))}
										</div>
									</div>

									<Button
										className="w-full"
										disabled={selectedForms.length === 0}
										onClick={handleGenerateForms}
									>
										<Download className="mr-2 h-4 w-4" />
										Generate Selected Forms
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				)}
			</div>
		</div>
	);
}
