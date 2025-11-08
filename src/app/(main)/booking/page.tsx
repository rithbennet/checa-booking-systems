"use client";

import { format } from "date-fns";
import {
	Bell,
	CalendarIcon,
	ChevronLeft,
	ChevronRight,
	FlaskConical,
	LogOut,
	Plus,
	Trash2,
	User,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/ui/shadcn/button";
import { Calendar } from "@/shared/ui/shadcn/calendar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import { Checkbox } from "@/shared/ui/shadcn/checkbox";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shared/ui/shadcn/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/shadcn/select";
import { Textarea } from "@/shared/ui/shadcn/textarea";

type SessionUser = { status?: string };
type Session = { user?: SessionUser } | null;

export default function BookingRequestForm() {
	// TODO: Get session from server or context
	// For now, allowing booking - will be gated by server-side auth
	const session = null as Session;
	const userStatus = session?.user?.status;
	const isBlocked =
		userStatus === "pending" ||
		userStatus === "inactive" ||
		userStatus === "rejected";
	const [, setCurrentStep] = useState(2);
	const [selectedServices] = useState([
		{
			id: "SRV001",
			name: "HPLC-Photodiode Array Detection",
			type: "Analysis Service",
			price: 65, // MJIIT member rate
			unit: "per sample",
			description:
				"High-performance liquid chromatography with photodiode array detection for compound identification and quantification",
		},
		{
			id: "SRV002",
			name: "Working Area (Bench fees)",
			type: "Working Space",
			price: 150, // MJIIT member rate
			unit: "per person per month",
			description: "Lab bench rental with basic equipment access",
			note: "*Subject to terms and conditions",
		},
	]);
	const [startDate, setStartDate] = useState<Date>();
	const [endDate, setEndDate] = useState<Date>();

	const steps = [
		{ number: 1, title: "Select Services", status: "completed" },
		{ number: 2, title: "Service Details", status: "current" },
		{ number: 3, title: "Project Information", status: "upcoming" },
		{ number: 4, title: "Review & Submit", status: "upcoming" },
	];

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="border-b bg-white shadow-sm">
				<div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-8">
							<div className="flex items-center space-x-4">
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
									<FlaskConical className="h-5 w-5 text-white" />
								</div>
								<div>
									<h1 className="font-bold text-gray-900 text-lg">ChECA Lab</h1>
									<p className="text-gray-600 text-xs">Service Portal</p>
								</div>
							</div>
							{/* Breadcrumb */}
							<nav className="flex items-center space-x-2 text-gray-500 text-sm">
								<span>Submit New Booking Request</span>
								<span>›</span>
								<span className="font-medium text-blue-600">
									Service Details
								</span>
							</nav>
						</div>
						<div className="flex items-center space-x-4">
							<Bell className="h-5 w-5 text-gray-600" />
							<div className="flex items-center space-x-2">
								<User className="h-5 w-5 text-gray-600" />
								<span className="font-medium text-sm">Harith Rahman</span>
								<span className="rounded bg-blue-50 px-2 py-1 text-gray-500 text-xs">
									MJIIT Member
								</span>
							</div>
							<Button size="sm" variant="ghost">
								<LogOut className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</header>

			<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
				{isBlocked && (
					<div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800">
						Your account is currently {userStatus}. You can browse the app, but
						you cannot submit new bookings until approved by an admin.
					</div>
				)}
				{/* Progress Indicator */}
				<div className="mb-8">
					<div className="flex items-center justify-between">
						{steps.map((step, index) => (
							<div className="flex flex-1 items-center" key={step.number}>
								<div className="flex items-center">
									<div
										className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
											step.status === "completed"
												? "border-green-500 bg-green-500 text-white"
												: step.status === "current"
													? "border-blue-500 bg-blue-500 text-white"
													: "border-gray-300 bg-white text-gray-500"
										}`}
									>
										{step.status === "completed" ? "✓" : step.number}
									</div>
									<div className="ml-3">
										<p
											className={`font-medium text-sm ${step.status === "current" ? "text-blue-600" : "text-gray-500"}`}
										>
											Step {step.number}
										</p>
										<p
											className={`text-xs ${step.status === "current" ? "text-blue-600" : "text-gray-500"}`}
										>
											{step.title}
										</p>
									</div>
								</div>
								{index < steps.length - 1 && (
									<div
										className={`mx-4 h-0.5 flex-1 ${step.status === "completed" ? "bg-green-500" : "bg-gray-300"}`}
									/>
								)}
							</div>
						))}
					</div>
				</div>

				{/* Form Content */}
				<Card>
					<CardHeader>
						<CardTitle className="text-xl">Service Details</CardTitle>
						<CardDescription>
							Provide detailed information for each selected service
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-8">
						{/* Selected Services */}
						<div>
							<h3 className="mb-4 font-semibold text-lg">Selected Services</h3>

							{selectedServices.map((service, index) => (
								<Card
									className="mb-6 border-l-4 border-l-blue-500 shadow-sm"
									key={service.id}
								>
									<CardHeader className="pb-4">
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<CardTitle className="font-semibold text-gray-900 text-lg">
													{service.name}
												</CardTitle>
												<CardDescription className="mt-1 text-gray-600 text-sm">
													{service.type} •{" "}
													<span className="font-medium text-blue-600">
														RM {service.price}
													</span>{" "}
													{service.unit}
												</CardDescription>
												{service.description && (
													<p className="mt-2 text-gray-500 text-sm">
														{service.description}
													</p>
												)}
												{service.note && (
													<p className="mt-1 font-medium text-amber-600 text-xs">
														{service.note}
													</p>
												)}
												{/* Role-based pricing indicator */}
												<div className="mt-2 flex w-fit items-center rounded-md bg-green-50 px-2 py-1 text-green-600 text-xs">
													<span>✓ MJIIT Member Rate Applied</span>
												</div>
											</div>
											<Button
												className="text-red-600 hover:bg-red-50 hover:text-red-800"
												size="sm"
												variant="ghost"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</CardHeader>
									<CardContent className="space-y-6">
										{service.type === "Analysis Service" && (
											<div className="space-y-6">
												<div className="border-blue-200 border-l-2 pl-4">
													<h4 className="mb-4 flex items-center font-medium text-gray-900">
														<div className="mr-2 h-2 w-2 rounded-full bg-blue-500"></div>
														Sample Details
													</h4>
													<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
														<div className="space-y-2">
															<Label
																className="font-medium text-gray-700 text-sm"
																htmlFor={`sample-type-${index}`}
															>
																Sample Type{" "}
																<span className="text-red-500">*</span>
															</Label>
															<Select>
																<SelectTrigger className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500">
																	<SelectValue placeholder="Select sample type" />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="liquid">Liquid</SelectItem>
																	<SelectItem value="solid">Solid</SelectItem>
																	<SelectItem value="powder">Powder</SelectItem>
																	<SelectItem value="solution">
																		Solution
																	</SelectItem>
																</SelectContent>
															</Select>
														</div>
														<div className="space-y-2">
															<Label
																className="font-medium text-gray-700 text-sm"
																htmlFor={`quantity-${index}`}
															>
																Quantity <span className="text-red-500">*</span>
															</Label>
															<Input
																className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
																id={`quantity-${index}`}
																min="1"
																placeholder="Enter quantity"
																type="number"
															/>
														</div>
													</div>

													{/* HPLC Preparation section */}
													<div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
														<div className="mb-3 flex items-center justify-between">
															<Label className="font-medium text-gray-700 text-sm">
																HPLC Sample Preparation
															</Label>
															<span className="rounded bg-blue-100 px-2 py-1 text-blue-600 text-xs">
																Additional: RM 20
															</span>
														</div>
														<div className="flex items-center space-x-2">
															<Checkbox id={`hplc-prep-${index}`} />
															<Label
																className="text-gray-600 text-sm"
																htmlFor={`hplc-prep-${index}`}
															>
																Filter and HPLC vial preparation required
															</Label>
														</div>
													</div>

													<div className="mt-4 space-y-2">
														<Label
															className="font-medium text-gray-700 text-sm"
															htmlFor={`preparation-${index}`}
														>
															Additional Preparation Method
														</Label>
														<Textarea
															className="border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
															id={`preparation-${index}`}
															placeholder="Describe any additional sample preparation methods..."
															rows={3}
														/>
													</div>
												</div>

												<div className="border-green-200 border-l-2 pl-4">
													<h4 className="mb-4 flex items-center font-medium text-gray-900">
														<div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
														Special Handling Requirements
													</h4>
													<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
														<div className="flex items-center space-x-2">
															<Checkbox id={`temperature-${index}`} />
															<Label
																className="text-gray-600 text-sm"
																htmlFor={`temperature-${index}`}
															>
																Temperature controlled storage
															</Label>
														</div>
														<div className="flex items-center space-x-2">
															<Checkbox id={`light-${index}`} />
															<Label
																className="text-gray-600 text-sm"
																htmlFor={`light-${index}`}
															>
																Light sensitive
															</Label>
														</div>
														<div className="flex items-center space-x-2">
															<Checkbox id={`hazardous-${index}`} />
															<Label
																className="text-gray-600 text-sm"
																htmlFor={`hazardous-${index}`}
															>
																Hazardous material
															</Label>
														</div>
														<div className="flex items-center space-x-2">
															<Checkbox id={`inert-${index}`} />
															<Label
																className="text-gray-600 text-sm"
																htmlFor={`inert-${index}`}
															>
																Inert atmosphere required
															</Label>
														</div>
													</div>
												</div>

												<div className="border-purple-200 border-l-2 pl-4">
													<h4 className="mb-4 flex items-center font-medium text-gray-900">
														<div className="mr-2 h-2 w-2 rounded-full bg-purple-500"></div>
														Technical Requirements
													</h4>
													<div className="space-y-2">
														<Label
															className="font-medium text-gray-700 text-sm"
															htmlFor={`technical-req-${index}`}
														>
															Specific Requirements
														</Label>
														<Textarea
															className="border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
															id={`technical-req-${index}`}
															placeholder="Specify solvent compatibility, column type, detection wavelength, flow rate, injection volume, etc."
															rows={4}
														/>
														<p className="mt-1 text-gray-500 text-xs">
															Please include details such as mobile phase
															preferences, gradient requirements, or specific
															detection parameters.
														</p>
													</div>
												</div>
											</div>
										)}

										{service.type === "Working Space" && (
											<div className="space-y-6">
												<div className="border-blue-200 border-l-2 pl-4">
													<h4 className="mb-4 flex items-center font-medium text-gray-900">
														<div className="mr-2 h-2 w-2 rounded-full bg-blue-500"></div>
														Booking Details
													</h4>
													<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
														<div className="space-y-2">
															<Label
																className="font-medium text-gray-700 text-sm"
																htmlFor={`duration-${index}`}
															>
																Duration <span className="text-red-500">*</span>
															</Label>
															<div className="flex space-x-2">
																<Input
																	className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
																	id={`duration-${index}`}
																	min="1"
																	placeholder="Enter duration"
																	type="number"
																/>
																<Select>
																	<SelectTrigger className="w-28 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
																		<SelectValue placeholder="Unit" />
																	</SelectTrigger>
																	<SelectContent>
																		<SelectItem value="months">
																			Months
																		</SelectItem>
																		<SelectItem value="weeks">Weeks</SelectItem>
																		<SelectItem value="days">Days</SelectItem>
																	</SelectContent>
																</Select>
															</div>
															<p className="text-gray-500 text-xs">
																Minimum booking: 1 month
															</p>
														</div>
													</div>
												</div>

												<div className="border-green-200 border-l-2 pl-4">
													<h4 className="mb-4 flex items-center font-medium text-gray-900">
														<div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
														Preferred Dates & Times
													</h4>
													<div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
														<div className="space-y-2">
															<Label className="font-medium text-gray-700 text-sm">
																Start Date{" "}
																<span className="text-red-500">*</span>
															</Label>
															<Popover>
																<PopoverTrigger asChild>
																	<Button
																		className="w-full justify-start border-gray-300 text-left font-normal focus:border-blue-500 focus:ring-blue-500"
																		variant="outline"
																	>
																		<CalendarIcon className="mr-2 h-4 w-4" />
																		{startDate
																			? format(startDate, "PPP")
																			: "Pick a date"}
																	</Button>
																</PopoverTrigger>
																<PopoverContent className="w-auto p-0">
																	<Calendar
																		initialFocus
																		mode="single"
																		onSelect={setStartDate}
																		selected={startDate}
																	/>
																</PopoverContent>
															</Popover>
														</div>
														<div className="space-y-2">
															<Label className="font-medium text-gray-700 text-sm">
																End Date <span className="text-red-500">*</span>
															</Label>
															<Popover>
																<PopoverTrigger asChild>
																	<Button
																		className="w-full justify-start border-gray-300 text-left font-normal focus:border-blue-500 focus:ring-blue-500"
																		variant="outline"
																	>
																		<CalendarIcon className="mr-2 h-4 w-4" />
																		{endDate
																			? format(endDate, "PPP")
																			: "Pick a date"}
																	</Button>
																</PopoverTrigger>
																<PopoverContent className="w-auto p-0">
																	<Calendar
																		initialFocus
																		mode="single"
																		onSelect={setEndDate}
																		selected={endDate}
																	/>
																</PopoverContent>
															</Popover>
														</div>
													</div>

													<div className="space-y-4">
														<div className="space-y-2">
															<Label
																className="font-medium text-gray-700 text-sm"
																htmlFor={`time-slot-${index}`}
															>
																Preferred Time Slot
															</Label>
															<Select>
																<SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
																	<SelectValue placeholder="Select time slot" />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="morning">
																		Morning (8:00 AM - 12:00 PM)
																	</SelectItem>
																	<SelectItem value="afternoon">
																		Afternoon (1:00 PM - 5:00 PM)
																	</SelectItem>
																	<SelectItem value="evening">
																		Evening (6:00 PM - 10:00 PM)
																	</SelectItem>
																	<SelectItem value="full-day">
																		Full Day (8:00 AM - 5:00 PM)
																	</SelectItem>
																</SelectContent>
															</Select>
														</div>
														<div className="space-y-2">
															<Label
																className="font-medium text-gray-700 text-sm"
																htmlFor={`deadline-${index}`}
															>
																Deadline Requirements
															</Label>
															<Input
																className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
																id={`deadline-${index}`}
																placeholder="Any specific deadline requirements..."
															/>
														</div>
													</div>
												</div>

												<div className="border-purple-200 border-l-2 pl-4">
													<h4 className="mb-4 flex items-center font-medium text-gray-900">
														<div className="mr-2 h-2 w-2 rounded-full bg-purple-500"></div>
														Equipment Needs
													</h4>
													<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
														<div className="flex items-center space-x-2">
															<Checkbox id={`fume-hood-${index}`} />
															<Label
																className="text-gray-600 text-sm"
																htmlFor={`fume-hood-${index}`}
															>
																Fume Hood
															</Label>
														</div>
														<div className="flex items-center space-x-2">
															<Checkbox id={`balance-${index}`} />
															<Label
																className="text-gray-600 text-sm"
																htmlFor={`balance-${index}`}
															>
																Analytical Balance
															</Label>
														</div>
														<div className="flex items-center space-x-2">
															<Checkbox id={`heating-${index}`} />
															<Label
																className="text-gray-600 text-sm"
																htmlFor={`heating-${index}`}
															>
																Heating Equipment
															</Label>
														</div>
														<div className="flex items-center space-x-2">
															<Checkbox id={`stirrer-${index}`} />
															<Label
																className="text-gray-600 text-sm"
																htmlFor={`stirrer-${index}`}
															>
																Magnetic Stirrer
															</Label>
														</div>
														<div className="flex items-center space-x-2">
															<Checkbox id={`rotary-${index}`} />
															<Label
																className="text-gray-600 text-sm"
																htmlFor={`rotary-${index}`}
															>
																Rotary Evaporator
															</Label>
														</div>
														<div className="flex items-center space-x-2">
															<Checkbox id={`vacuum-${index}`} />
															<Label
																className="text-gray-600 text-sm"
																htmlFor={`vacuum-${index}`}
															>
																Vacuum System
															</Label>
														</div>
													</div>
													<div className="mt-4 space-y-2">
														<Label
															className="font-medium text-gray-700 text-sm"
															htmlFor={`other-equipment-${index}`}
														>
															Other Equipment Requirements
														</Label>
														<Textarea
															className="border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
															id={`other-equipment-${index}`}
															placeholder="Specify any additional equipment or special requirements..."
															rows={2}
														/>
													</div>
												</div>
											</div>
										)}
									</CardContent>
								</Card>
							))}

							<Button
								className="w-full border-2 border-gray-300 border-dashed py-4 text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
								variant="outline"
							>
								<Plus className="mr-2 h-4 w-4" />
								Add Another Service
							</Button>
						</div>

						{/* Additional Notes */}
						<div className="space-y-3 border-gray-200 border-t pt-6">
							<Label
								className="font-medium text-gray-700 text-sm"
								htmlFor="additional-notes"
							>
								Additional Notes/Instructions (Optional)
							</Label>
							<Textarea
								className="border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
								id="additional-notes"
								placeholder="Any additional information, special instructions, or requirements not covered above..."
								rows={4}
							/>
							<p className="text-gray-500 text-xs">
								Please include any specific requirements, safety considerations,
								or special arrangements needed for your services.
							</p>
						</div>

						{/* Navigation Buttons */}
						<div className="flex items-center justify-between border-gray-200 border-t pt-6">
							<Button
								className="border-gray-300 text-gray-700 hover:bg-gray-50"
								onClick={() => setCurrentStep(1)}
								variant="outline"
							>
								<ChevronLeft className="mr-2 h-4 w-4" />
								Previous: Select Services
							</Button>
							<div className="flex items-center space-x-4">
								<Button
									className="text-gray-600 hover:text-gray-800"
									disabled={isBlocked}
									variant="ghost"
								>
									Save as Draft
								</Button>
								<Button
									className="bg-blue-600 px-6 text-white hover:bg-blue-700"
									disabled={isBlocked}
									onClick={() => setCurrentStep(3)}
								>
									Next: Project Information
									<ChevronRight className="ml-2 h-4 w-4" />
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
