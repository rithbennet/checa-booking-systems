"use client";

import {
	Bell,
	ChevronLeft,
	ChevronRight,
	FlaskConical,
	LogOut,
	Plus,
	User,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import { Label } from "@/shared/ui/shadcn/label";
import { Textarea } from "@/shared/ui/shadcn/textarea";
import { BookingProgress, ServiceDetailsForm } from "@/features/booking-form";
import type { BookingServiceItem, BookingStep } from "@/entities/booking";
import type { Service } from "@/entities/service";

interface BookingPageProps {
	userType?: "mjiit_member" | "utm_member" | "external_member";
	userStatus?: string;
	initialServices?: Array<{ service: Service; item: BookingServiceItem }>;
}

export function BookingPage({
	userType = "mjiit_member",
	userStatus,
	initialServices = [],
}: BookingPageProps) {
	const [currentStep, setCurrentStep] = useState(2);
	const [selectedServices, setSelectedServices] = useState<
		Array<{ service: Service; item: BookingServiceItem }>
	>(initialServices);
	const [projectDescription, setProjectDescription] = useState("");
	const [additionalNotes, setAdditionalNotes] = useState("");

	const isBlocked =
		userStatus === "pending" ||
		userStatus === "inactive" ||
		userStatus === "rejected";

	const steps: BookingStep[] = [
		{ number: 1, title: "Select Services", status: "completed" },
		{ number: 2, title: "Service Details", status: "current" },
		{ number: 3, title: "Project Information", status: "upcoming" },
		{ number: 4, title: "Review & Submit", status: "upcoming" },
	];

	const handleServiceUpdate = (
		index: number,
		data: Partial<BookingServiceItem>,
	) => {
		setSelectedServices((prev) => {
			const updated = [...prev];
			updated[index] = {
				...updated[index],
				item: { ...updated[index].item, ...data },
			};
			return updated;
		});
	};

	const handleAddService = () => {
		// Navigate back to services page to add more
		window.location.href = "/services";
	};

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

				<BookingProgress steps={steps} />

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

							{selectedServices.map(({ service, item }, index) => (
								<ServiceDetailsForm
									key={item.id || index}
									service={service}
									serviceItem={item}
									index={index}
									onUpdate={handleServiceUpdate}
									onRemove={() => {
										setSelectedServices((prev) =>
											prev.filter((_, i) => i !== index),
										);
									}}
								/>
							))}

							<Button
								className="w-full border-2 border-gray-300 border-dashed py-4 text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
								variant="outline"
								onClick={handleAddService}
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
								onChange={(e) => setAdditionalNotes(e.target.value)}
								placeholder="Any additional information, special instructions, or requirements not covered above..."
								rows={4}
								value={additionalNotes}
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

