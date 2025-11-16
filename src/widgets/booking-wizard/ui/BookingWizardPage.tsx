"use client";

import {
	AlertCircle,
	ChevronLeft,
	ChevronRight,
	Save,
	Trash2,
} from "lucide-react";
import { useMemo } from "react";
import type { LabEquipment } from "@/entities/booking";
import type {
	BookingServiceItemInput,
	CreateBookingInput,
} from "@/entities/booking/model/schemas";
import type { Service, UserType } from "@/entities/service";
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
import { LoadingDialog } from "@/shared/ui/LoadingDialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/shared/ui/shadcn/alert-dialog";
import { Button } from "@/shared/ui/shadcn/button";
import { ServicesValidationDialog } from "./ServicesValidationDialog";

type BookingMode = "new" | "edit";

interface BookingWizardPageProps {
	mode: BookingMode;
	bookingId?: string;
	initialData?: CreateBookingInput;
	initialServices?: Array<{
		service: Service;
		item?: Partial<BookingServiceItemInput>;
	}>;
	services: Service[];
	equipment: LabEquipment[];
	profile: BookingProfile;
	userType: UserType;
	userStatus?: string;
	userId: string;
}

export function BookingWizardPage({
	mode,
	bookingId,
	initialData,
	initialServices,
	services,
	equipment,
	profile,
	userType,
	userStatus,
	userId,
}: BookingWizardPageProps) {
	// Generate draft key for this booking
	const draftKey = useMemo(
		() => `booking_${userId}_${mode}_${bookingId ?? "new"}`,
		[userId, mode, bookingId],
	);

	const bookingForm = useBookingForm({
		mode,
		bookingId,
		initialData,
		initialServices,
		userType,
		userStatus,
		services,
		profile,
		draftKey,
	});

	const {
		form,
		fields,
		workspaceFields,
		isBlocked,
		currentStep,
		isServiceDialogOpen,
		selectedServiceIds,
		servicesValidationOpen,
		servicesValidationData,
		handleAddService,
		handleAddSample,
		handleRemoveService,
		handleRemoveServiceGroup,
		handleServiceUpdate,
		handleAddWorkspace,
		handleWorkspaceUpdate,
		handleRemoveWorkspace,
		handleNext,
		handlePrevious,
		handleSaveDraft,
		handleDiscard,
		discardDraftIfUnsaved,
		onSubmit,
		getServiceForField,
		setServiceDialogOpen,
		setServicesValidationOpen,
		isSubmitting,
		isSubmittingDialog,
		isSaving,
		lastSavedAt,
		hasSavedStep1,
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

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-6">
					<h1 className="font-bold text-3xl text-gray-900">
						{mode === "edit" ? "Create Booking Draft" : "New Booking Request"}
					</h1>
					{bookingId && (
						<p className="mt-2 text-gray-600 text-sm">
							Booking ID: {bookingId}
						</p>
					)}
					{lastSavedAt && (
						<p className="mt-1 text-gray-500 text-xs">
							Last saved:{" "}
							{new Date(lastSavedAt).toLocaleTimeString(undefined, {
								hour: "2-digit",
								minute: "2-digit",
							})}
						</p>
					)}
				</div>

				{/* Account status warning */}
				{isBlocked && (
					<div className="mb-6 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-4">
						<AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
						<div className="flex-1 text-amber-800 text-sm">
							Your account is currently {userStatus}. You can browse the app,
							but you cannot submit new bookings until approved by an admin.
						</div>
					</div>
				)}

				{/* Progress */}
				<BookingProgress
					currentStep={currentStep}
					onStepClick={(n) => {
						// Only allow navigating to previous steps
						if (n < currentStep) {
							bookingForm.setCurrentStep(n);
						}
					}}
					steps={steps}
				/>

				{/* Form Content */}
				<form onSubmit={form.handleSubmit(onSubmit)}>
					{currentStep === 1 && (
						<ServicesStep
							availableEquipment={equipment}
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
							workingSpaceService={services.find(
								(s) => s.category === "working_space",
							)}
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
					<div className="mt-6 flex items-center justify-between gap-4">
						<div className="flex items-center gap-3">
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
						</div>

						<div className="ml-auto flex items-center gap-3">
							{/* Discard button - only for drafts */}
							{mode === "edit" ? (
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button
											className="text-red-600 hover:bg-red-50 hover:text-red-700"
											type="button"
											variant="ghost"
										>
											<Trash2 className="mr-2 h-4 w-4" />
											Cancel
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>
												{currentStep === 1 && !hasSavedStep1
													? "Save or discard this draft?"
													: "Discard booking draft?"}
											</AlertDialogTitle>
											<AlertDialogDescription>
												{currentStep === 1 && !hasSavedStep1
													? "You have unsaved changes. Would you like to save your progress or discard this draft?"
													: "This action cannot be undone. All your progress will be permanently deleted."}
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancel</AlertDialogCancel>
											{currentStep === 1 && !hasSavedStep1 && (
												<AlertDialogAction
													onClick={async () => {
														await handleSaveDraft();
														window.location.href = "/bookings";
													}}
												>
													Save & Exit
												</AlertDialogAction>
											)}
											<AlertDialogAction
												className="bg-red-600 hover:bg-red-700"
												onClick={
													currentStep === 1 && !hasSavedStep1
														? async () => {
															await discardDraftIfUnsaved();
															window.location.href = "/bookings";
														}
														: handleDiscard
												}
											>
												Discard
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							) : null}

							{/* Save Draft button */}
							<Button
								className="text-gray-600 hover:text-gray-800"
								disabled={isBlocked || isSaving}
								onClick={handleSaveDraft}
								type="button"
								variant="ghost"
							>
								<Save className="mr-2 h-4 w-4" />
								{isSaving ? "Saving..." : "Save Draft"}
							</Button>

							{/* Next/Submit button */}
							{currentStep < 4 ? (
								<Button disabled={isBlocked} onClick={handleNext} type="button">
									Next
									<ChevronRight className="ml-2 h-4 w-4" />
								</Button>
							) : (
								<Button disabled={isBlocked || isSubmitting} type="submit">
									{isSubmitting ? "Submitting..." : "Submit Booking"}
								</Button>
							)}
						</div>
					</div>
				</form>

				{/* Service Selection Dialog */}
				<ServiceSelectionDialog
					onOpenChange={setServiceDialogOpen}
					onSelectService={handleAddService}
					open={isServiceDialogOpen}
					selectedServiceIds={selectedServiceIds}
					services={services}
					userType={userType}
				/>

				{/* Validation Dialog for Services Step */}
				<ServicesValidationDialog
					data={servicesValidationData}
					onOpenChange={setServicesValidationOpen}
					open={servicesValidationOpen}
				/>

				{/* Global submitting dialog */}
				<LoadingDialog
					description="Please wait while we submit your booking and redirect you to the details page."
					open={isSubmittingDialog || isSubmitting}
					title="Submitting booking"
				/>
			</div>
		</div>
	);
}
