"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { CreateBookingInput } from "@/entities/booking/model/schemas";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/shadcn/button";
import { Calendar } from "@/shared/ui/shadcn/calendar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import { Label } from "@/shared/ui/shadcn/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shared/ui/shadcn/popover";
import { Textarea } from "@/shared/ui/shadcn/textarea";

interface ProjectInfoStepProps {
	form: UseFormReturn<CreateBookingInput>;
}

export function ProjectInfoStep({ form }: ProjectInfoStepProps) {
	const preferredStartDate = form.watch("preferredStartDate");
	const preferredEndDate = form.watch("preferredEndDate");

	const today = new Date();
	const startDisabled = (date: Date) => {
		const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
		const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		// disable past days
		return d < t;
	};
	const endDisabled = (date: Date) => {
		const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
		const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		// cannot pick before start date (if chosen), otherwise cannot pick before today
		if (preferredStartDate) {
			const s = new Date(
				preferredStartDate.getFullYear(),
				preferredStartDate.getMonth(),
				preferredStartDate.getDate(),
			);
			return d < s;
		}
		return d < t;
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-xl">Project Information</CardTitle>
				<CardDescription>
					Provide details about your project and any additional requirements
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Preferred Dates (optional) */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<Label
							className="font-medium text-gray-700 text-sm"
							htmlFor="preferred-start"
						>
							Preferred Start Date (Optional)
						</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									className={cn(
										"w-full justify-start border-gray-300 bg-white text-left font-normal hover:bg-gray-50",
										!preferredStartDate && "text-muted-foreground",
									)}
									id="preferred-start"
									variant="outline"
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{preferredStartDate ? (
										format(preferredStartDate, "PPP")
									) : (
										<span>Pick a date</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent align="start" className="w-auto p-0">
								<Calendar
									disabled={startDisabled}
									mode="single"

									onSelect={(date) => {
										// date may be null when clearing via calendar; keep optional
										const next = date ?? undefined;
										form.setValue("preferredStartDate", next, {
											shouldDirty: true,
											shouldValidate: true,
										});
										// If end is set but now before start, clear it
										if (next && preferredEndDate && preferredEndDate < next) {
											form.setValue("preferredEndDate", undefined, {
												shouldDirty: true,
												shouldValidate: true,
											});
										}
									}}
									selected={preferredStartDate ?? undefined}
								/>
							</PopoverContent>
						</Popover>
					</div>

					<div className="space-y-2">
						<Label
							className="font-medium text-gray-700 text-sm"
							htmlFor="preferred-end"
						>
							Preferred End Date (Optional)
						</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									className={cn(
										"w-full justify-start border-gray-300 bg-white text-left font-normal hover:bg-gray-50",
										!preferredEndDate && "text-muted-foreground",
									)}
									id="preferred-end"
									variant="outline"
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{preferredEndDate ? (
										format(preferredEndDate, "PPP")
									) : (
										<span>Pick a date</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent align="start" className="w-auto p-0">
								<Calendar
									disabled={endDisabled}
									mode="single"
									onSelect={(date) => {
										const next = date ?? undefined;
										form.setValue("preferredEndDate", next, {
											shouldDirty: true,
											shouldValidate: true,
										});
									}}
									selected={preferredEndDate ?? undefined}
								/>
							</PopoverContent>
						</Popover>
					</div>
				</div>

				{/* Project Description */}
				<div className="space-y-3">
					<Label
						className="font-medium text-gray-700 text-sm"
						htmlFor="project-description"
					>
						Project Description <span className="text-red-600">*</span>
					</Label>
					<Textarea
						className={cn(
							"border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500",
							form.formState.errors.projectDescription
								? "border-red-500 focus:border-red-500 focus:ring-red-500"
								: "",
						)}
						id="project-description"
						{...form.register("projectDescription")}
						placeholder="Briefly describe your project, research objectives, or intended use of the services..."
						rows={5}
					/>
					{form.formState.errors.projectDescription ? (
						<p className="text-red-600 text-xs">
							{form.formState.errors.projectDescription.message as string}
						</p>
					) : (
						<p className="text-gray-500 text-xs">
							This helps our team better understand your requirements and
							provide appropriate support.
						</p>
					)}
				</div>

				{/* Additional Notes */}
				<div className="space-y-3">
					<Label
						className="font-medium text-gray-700 text-sm"
						htmlFor="additional-notes"
					>
						Additional Notes/Special Instructions (Optional)
					</Label>
					<Textarea
						className="border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
						id="additional-notes"
						{...form.register("additionalNotes")}
						placeholder="Any additional information, special instructions, safety considerations, or requirements not covered above..."
						rows={5}
					/>
					<p className="text-gray-500 text-xs">
						Include any specific requirements, deadlines, safety considerations,
						or special arrangements needed for your services.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
