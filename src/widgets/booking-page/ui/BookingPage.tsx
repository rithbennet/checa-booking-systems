"use client";

import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useMemo } from "react";
import type { BookingServiceItem, LabEquipment } from "@/entities/booking";
import { draftKey, getDraft } from "@/entities/booking/lib/draftService";
import type { CreateBookingInput } from "@/entities/booking/model/schemas";
import type { Service } from "@/entities/service";
import {
	type BookingProfile,
	BookingProgress,
	ServiceSelectionDialog,
} from "@/features/booking-form";
import { useBookingForm } from "@/features/booking-form/lib/use-booking-form";
import { PayerInfoStep } from "@/features/booking-form/ui/steps/PayerInfoStep";
import { ProjectInfoStep } from "@/features/booking-form/ui/steps/ProjectInfoStep";
import { ReviewStep } from "@/features/booking-form/ui/steps/ReviewStep";
import { ServicesStep } from "@/features/booking-form/ui/steps/ServicesStep";
import { Button } from "@/shared/ui/shadcn/button";

interface BookingPageProps {
	userId: string;
	userType?: "mjiit_member" | "utm_member" | "external_member";
	userStatus?: string;
	initialServices?: Array<{ service: Service; item: BookingServiceItem }>;
	services?: Service[];
	equipment?: LabEquipment[];
	profile: BookingProfile;
	mode?: "new" | "edit";
	bookingId?: string;
}

export function BookingPage({
	userId,
	userType = "mjiit_member",
	userStatus,
	initialServices = [],
	services = [],
	equipment = [],
	profile,
	mode = "new",
	bookingId,
}: BookingPageProps) {
	// Compute draft key for this booking
	const currentDraftKey = useMemo(
		() => draftKey(userId, mode, bookingId),
		[userId, mode, bookingId],
	);

	// Load draft on mount
	const initialDraft = useMemo(
		() => getDraft<Partial<CreateBookingInput>>(currentDraftKey),
		[currentDraftKey],
	);

	const bookingForm = useBookingForm({
		userType,
		userStatus,
		services,
		profile,
		initialDraft,
		initialServices,
		draftKey: currentDraftKey,
	});

	const availableEquipment = equipment ?? [];

	const {
		form,
		fields,
		workspaceFields,
		isBlocked,
		currentStep,
		isServiceDialogOpen,
		selectedServiceIds,
		handleAddService,
		handleAddSample,
		handleRemoveService,
		handleRemoveServiceGroup,
		handleAddWorkspace,
		handleWorkspaceUpdate,
		handleRemoveWorkspace,
		handleServiceUpdate,
		handleSaveDraft,
		onSubmit,
		getServiceForField,
		setServiceDialogOpen,
		setCurrentStep,
		isSubmitting,
	} = bookingForm;

	const steps = [
		{
			number: 1,
			title: "Services",
			status:
				currentStep === 1
					? ("current" as const)
					: currentStep > 1
						? ("completed" as const)
						: ("upcoming" as const),
		},
		{
			number: 2,
			title: "Project Information",
			status:
				currentStep === 2
					? ("current" as const)
					: currentStep > 2
						? ("completed" as const)
						: ("upcoming" as const),
		},
		{
			number: 3,
			title: "Billing & Payer",
			status:
				currentStep === 3
					? ("current" as const)
					: currentStep > 3
						? ("completed" as const)
						: ("upcoming" as const),
		},
		{
			number: 4,
			title: "Review & Submit",
			status: currentStep === 4 ? ("current" as const) : ("upcoming" as const),
		},
	];

	const canProceedFromStep1 = fields.length > 0;

	const handleNext = () => {
		if (currentStep === 1 && !canProceedFromStep1) {
			return;
		}
		setCurrentStep(Math.min(currentStep + 1, 4));
	};

	const handlePrevious = () => {
		setCurrentStep(Math.max(currentStep - 1, 1));
	};

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
				<form onSubmit={form.handleSubmit(onSubmit)}>
					{currentStep === 1 && (
						<ServicesStep
							availableEquipment={availableEquipment}
							fields={fields}
							getServiceForField={getServiceForField}
							handleAddSample={handleAddSample}
							handleAddWorkspace={handleAddWorkspace}
							handleRemoveService={handleRemoveService}
							handleRemoveServiceGroup={handleRemoveServiceGroup}
							handleRemoveWorkspace={handleRemoveWorkspace}
							handleServiceUpdate={handleServiceUpdate}
							handleWorkspaceUpdate={handleWorkspaceUpdate}
							setServiceDialogOpen={setServiceDialogOpen}
							workspaceFields={workspaceFields}
						/>
					)}

					{currentStep === 2 && <ProjectInfoStep form={form} />}

					{currentStep === 3 && (
						<PayerInfoStep form={form} profile={profile} userType={userType} />
					)}

					{currentStep === 4 && (
						<ReviewStep
							fields={fields}
							form={form}
							getServiceForField={getServiceForField}
							services={services}
							userType={userType}
						/>
					)}

					{/* Navigation Buttons */}
					<div className="mt-6 flex items-center justify-between">
						{currentStep > 1 && (
							<Button
								className="border-gray-300 text-gray-700 hover:bg-gray-50"
								onClick={handlePrevious}
								type="button"
								variant="outline"
							>
								<ChevronLeft className="mr-2 h-4 w-4" />
								Previous
							</Button>
						)}

						<div className="ml-auto flex items-center space-x-4">
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

							{currentStep < 4 ? (
								<Button
									className="bg-blue-600 px-6 text-white hover:bg-blue-700"
									disabled={
										isBlocked || (currentStep === 1 && !canProceedFromStep1)
									}
									onClick={handleNext}
									type="button"
								>
									Next
									<ChevronRight className="ml-2 h-4 w-4" />
								</Button>
							) : (
								<Button
									className="bg-green-600 px-6 text-white hover:bg-green-700"
									disabled={isBlocked || isSubmitting}
									type="submit"
								>
									{isSubmitting ? "Submitting..." : "Submit Booking"}
								</Button>
							)}
						</div>
					</div>
				</form>
			</div>

			{/* Service Selection Dialog */}
			<ServiceSelectionDialog
				onOpenChange={setServiceDialogOpen}
				onSelectService={handleAddService}
				open={isServiceDialogOpen}
				selectedServiceIds={selectedServiceIds}
				services={services}
				userType={userType}
			/>
		</div>
	);
}
