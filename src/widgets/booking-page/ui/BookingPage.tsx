"use client";

import { ChevronLeft, ChevronRight, Plus, Save } from "lucide-react";
import type { BookingServiceItem, BookingStep } from "@/entities/booking";
import type { Service } from "@/entities/service";
import {
	BookingProgress,
	ServiceGroupForm,
	ServiceSelectionDialog,
} from "@/features/booking-form";
import { useBookingForm } from "@/features/booking-form/lib/use-booking-form";
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
	const bookingForm = useBookingForm({
		userType,
		userStatus,
		initialServices,
	});

	const {
		form,
		fields,
		isBlocked,
		isServiceDialogOpen,
		selectedServiceIds,
		handleAddService,
		handleAddSample,
		handleRemoveService,
		handleRemoveServiceGroup,
		handleServiceUpdate,
		handleSaveDraft,
		onSubmit,
		getServiceForField,
		setServiceDialogOpen,
		setCurrentStep,
		isSubmitting,
	} = bookingForm;

	const steps: BookingStep[] = [
		{ number: 1, title: "Select Services", status: "completed" },
		{ number: 2, title: "Service Details", status: "current" },
		{ number: 3, title: "Project Information", status: "upcoming" },
		{ number: 4, title: "Review & Submit", status: "upcoming" },
	];

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
				{isBlocked && (
					<div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800">
						Your account is currently {userStatus}. You can browse the app, but
						you cannot submit new bookings until approved by an admin.
					</div>
				)}

				<BookingProgress steps={steps} />

				{/* Form Content */}
				<form onSubmit={bookingForm.form.handleSubmit(onSubmit)}>
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
								<h3 className="mb-4 font-semibold text-lg">
									Selected Services
								</h3>

								{fields.length === 0 ? (
									<div className="rounded-lg border-2 border-gray-300 border-dashed p-8 text-center">
										<p className="text-gray-500">
											No services selected. Click "Add Another Service" to get
											started.
										</p>
									</div>
								) : (
									(() => {
										// Group service items by serviceId
										type GroupedItems = Array<{
											index: number;
											item: (typeof fields)[0];
										}>;
										const grouped = fields.reduce(
											(acc, field, index) => {
												const serviceId = field.serviceId;
												if (!acc[serviceId]) {
													acc[serviceId] = [];
												}
												acc[serviceId].push({ index, item: field });
												return acc;
											},
											{} as Record<string, GroupedItems>,
										);

										return (
											Object.entries(grouped) as [string, GroupedItems][]
										).map(([serviceId, serviceItems]) => {
											const service = getServiceForField(serviceId);
											if (!service) {
												return null;
											}

											return (
												<ServiceGroupForm
													key={serviceId}
													onAddSample={handleAddSample}
													onRemove={handleRemoveService}
													onRemoveGroup={handleRemoveServiceGroup}
													onUpdate={handleServiceUpdate}
													service={service}
													serviceItems={serviceItems}
												/>
											);
										});
									})()
								)}

								<Button
									className="w-full border-2 border-gray-300 border-dashed py-4 text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
									onClick={() => setServiceDialogOpen(true)}
									type="button"
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
									{...form.register("additionalNotes")}
									placeholder="Any additional information, special instructions, or requirements not covered above..."
									rows={4}
								/>
								<p className="text-gray-500 text-xs">
									Please include any specific requirements, safety
									considerations, or special arrangements needed for your
									services.
								</p>
							</div>

							{/* Navigation Buttons */}
							<div className="flex items-center justify-between border-gray-200 border-t pt-6">
								<Button
									className="border-gray-300 text-gray-700 hover:bg-gray-50"
									onClick={() => setCurrentStep(1)}
									type="button"
									variant="outline"
								>
									<ChevronLeft className="mr-2 h-4 w-4" />
									Previous: Select Services
								</Button>
								<div className="flex items-center space-x-4">
									<Button
										className="text-gray-600 hover:text-gray-800"
										disabled={isBlocked}
										onClick={handleSaveDraft}
										type="button"
										variant="ghost"
									>
										<Save className="mr-2 h-4 w-4" />
										Save as Draft
									</Button>
									<Button
										className="bg-blue-600 px-6 text-white hover:bg-blue-700"
										disabled={isBlocked || isSubmitting}
										type="submit"
									>
										{isSubmitting ? "Submitting..." : "Submit Booking"}
										<ChevronRight className="ml-2 h-4 w-4" />
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</form>
			</div>

			{/* Service Selection Dialog */}
			<ServiceSelectionDialog
				onOpenChange={setServiceDialogOpen}
				onSelectService={handleAddService}
				open={isServiceDialogOpen}
				selectedServiceIds={selectedServiceIds}
				userType={userType}
			/>
		</div>
	);
}
