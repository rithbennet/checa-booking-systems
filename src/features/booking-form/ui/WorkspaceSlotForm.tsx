"use client";

import { format } from "date-fns";
import {
	AlertCircle,
	Calendar as CalendarIcon,
	CheckCircle2,
	Circle,
	Info,
	Sparkles,
	X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CreateBookingInput } from "@/entities/booking/model/schemas";
import type { Service } from "@/entities/service";
import { cn } from "@/shared/lib/utils";
import {
	AccordionContentNoAutoClose,
	AccordionItemNoAutoClose,
	AccordionNoAutoClose,
	AccordionTriggerNoAutoClose,
} from "@/shared/ui/shadcn/accordion-no-auto-close";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/shadcn/alert";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import { Calendar } from "@/shared/ui/shadcn/calendar";
import { Checkbox } from "@/shared/ui/shadcn/checkbox";
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
import {
	calculateWorkspaceEndDate,
	calculateWorkspaceMonths,
	getWorkspaceAdditionalNotes,
	getWorkspacePurpose,
	getWorkspaceTimeSlot,
	hasOverlappingBooking,
	isValidWorkspaceStartDate,
	parseWorkspaceDates,
	updateWorkspaceNotes,
} from "../lib/workspace-utils";
import { EquipmentSelector } from "./EquipmentSelector";

type ServiceItem = NonNullable<CreateBookingInput["serviceItems"]>[number];

interface WorkspaceSlotFormProps {
	service: Service;
	serviceItem: Partial<ServiceItem>;
	index: number;
	onUpdate: (data: Partial<ServiceItem>) => void;
	allSlots: Array<Partial<ServiceItem>>;
	excludeIndex: number;
	onRemove?: (index: number) => void;
	totalSlots?: number;
}

export function WorkspaceSlotForm({
	service,
	serviceItem,
	index,
	onUpdate,
	allSlots,
	excludeIndex,
	onRemove,
	totalSlots = 1,
}: WorkspaceSlotFormProps) {
	const [localStartDate, setLocalStartDate] = useState<Date | undefined>();
	const [localMonths, setLocalMonths] = useState<number>(1);

	// Keep local state synced with serviceItem notes
	useEffect(() => {
		const parsed = parseWorkspaceDates(serviceItem);
		setLocalStartDate(parsed.startDate);
		if (parsed.startDate && parsed.endDate) {
			const months = calculateWorkspaceMonths(parsed.startDate, parsed.endDate);
			setLocalMonths(Math.max(1, months));
		} else {
			setLocalMonths(1);
		}
	}, [serviceItem]);
	// Get add-ons from service
	const allAddOns = service.addOns || [];
	// Filter to only show add-ons applicable to workspace
	const addOns = allAddOns.filter(
		(addon) =>
			addon.applicableTo === "workspace" || addon.applicableTo === "both",
	);
	const selectedAddOnIds = (serviceItem.addOnIds as string[]) || [];

	// Calculate end date from start date and months
	const calculatedEndDate = useMemo(() => {
		if (!localStartDate) return undefined;
		return calculateWorkspaceEndDate(localStartDate, localMonths);
	}, [localStartDate, localMonths]);

	// Check for overlapping bookings
	const hasOverlap = useMemo(() => {
		if (!localStartDate || !calculatedEndDate) return false;
		return hasOverlappingBooking(
			localStartDate,
			calculatedEndDate,
			allSlots,
			excludeIndex,
		);
	}, [localStartDate, calculatedEndDate, allSlots, excludeIndex]);

	// Check if form is complete (minimum 1 month = 30 days duration, no overlaps)
	const isComplete = useMemo(() => {
		if (!localStartDate) return false;
		return (
			localMonths >= 1 &&
			isValidWorkspaceStartDate(localStartDate) &&
			!hasOverlap
		);
	}, [localStartDate, localMonths, hasOverlap]);

	// Format date range for display
	const dateRangeDisplay = useMemo(() => {
		if (!localStartDate || !calculatedEndDate) return "Select start date";
		return `${format(localStartDate, "MMM d, yyyy")} - ${format(calculatedEndDate, "MMM d, yyyy")}`;
	}, [localStartDate, calculatedEndDate]);

	const handleStartDateChange = (date: Date | undefined) => {
		if (!date) return;

		setLocalStartDate(date);
		const endDate = calculateWorkspaceEndDate(date, localMonths);
		const currentNotes = (serviceItem.notes as string) || "";

		onUpdate({
			notes: updateWorkspaceNotes(currentNotes, {
				startDate: date,
				endDate,
			}),
			expectedCompletionDate: date,
			durationMonths: localMonths,
		});
	};

	const handleMonthsChange = (months: number) => {
		if (!localStartDate) return;

		setLocalMonths(months);
		const endDate = calculateWorkspaceEndDate(localStartDate, months);
		const currentNotes = (serviceItem.notes as string) || "";

		onUpdate({
			notes: updateWorkspaceNotes(currentNotes, {
				startDate: localStartDate,
				endDate,
			}),
			expectedCompletionDate: localStartDate,
			durationMonths: months,
		});
	};

	return (
		<AccordionNoAutoClose className="w-full" type="multiple">
			<AccordionItemNoAutoClose
				className="border-0"
				value={`workspace-slot-${index}`}
			>
				<div className="flex items-center justify-between px-4 py-3">
					<AccordionTriggerNoAutoClose className="flex flex-1 items-center justify-between hover:no-underline focus:outline-none">
						<div className="flex items-center gap-3">
							{isComplete ? (
								<CheckCircle2 className="h-5 w-5 text-green-600" />
							) : (
								<Circle className="h-5 w-5 text-gray-400" />
							)}
							<span className="font-medium text-gray-900">
								{dateRangeDisplay}
								{localMonths > 0 && (
									<span className="ml-2 text-gray-500 text-sm">
										({localMonths} {localMonths === 1 ? "month" : "months"})
									</span>
								)}
							</span>
						</div>
						<Badge
							className={
								isComplete
									? "bg-green-100 text-green-800"
									: "bg-gray-100 text-gray-600"
							}
							variant={isComplete ? "default" : "secondary"}
						>
							{isComplete ? "Complete" : "Incomplete"}
						</Badge>
					</AccordionTriggerNoAutoClose>

					{/* Remove button (outside trigger but inline) */}
					{totalSlots > 1 && onRemove && (
						<Button
							className="ml-2 h-8 w-8 shrink-0 rounded-md text-gray-500 hover:bg-red-50 hover:text-red-600"
							onClick={() => onRemove(index)}
							size="icon"
							title="Remove slot"
							type="button"
							variant="ghost"
						>
							<X className="h-4 w-4" />
						</Button>
					)}
				</div>
				<AccordionContentNoAutoClose className="px-4 pb-4">
					<div className="space-y-6">
						{/* Start Date and Duration Selection */}
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label
									className="font-medium text-gray-700 text-sm"
									htmlFor={`workspace-start-${index}`}
								>
									Start Date <span className="text-red-500">*</span>
								</Label>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											className={cn(
												"w-full justify-start border-gray-300 bg-white text-left font-normal hover:bg-gray-50",
												!localStartDate && "text-muted-foreground",
											)}
											id={`workspace-start-${index}`}
											variant="outline"
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{localStartDate ? (
												format(localStartDate, "PPP")
											) : (
												<span>Pick a date</span>
											)}
										</Button>
									</PopoverTrigger>
									<PopoverContent align="start" className="w-auto p-0">
										<Calendar
											disabled={(date) => {
												// Disable past dates
												if (!isValidWorkspaceStartDate(date)) return true;

												// Check if selecting this date would create an overlap
												// We need to check with the current months value
												if (localMonths > 0) {
													const testEndDate = calculateWorkspaceEndDate(
														date,
														localMonths,
													);
													return hasOverlappingBooking(
														date,
														testEndDate,
														allSlots,
														excludeIndex,
													);
												}

												return false;
											}}
											mode="single"
											modifiersClassNames={{
												selected: "bg-blue-600 text-white",
												disabled: "opacity-40 cursor-not-allowed",
											}}
											onSelect={handleStartDateChange}
											selected={localStartDate}
										/>
									</PopoverContent>
								</Popover>
							</div>
							<div className="space-y-2">
								<Label
									className="font-medium text-gray-700 text-sm"
									htmlFor={`workspace-months-${index}`}
								>
									Duration (Months) <span className="text-red-500">*</span>
								</Label>
								<Select
									onValueChange={(value) =>
										handleMonthsChange(parseInt(value, 10))
									}
									value={localMonths.toString()}
								>
									<SelectTrigger
										className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
										id={`workspace-months-${index}`}
									>
										<SelectValue placeholder="Select duration" />
									</SelectTrigger>
									<SelectContent>
										{Array.from({ length: 12 }, (_, i) => i + 1).map(
											(month) => (
												<SelectItem key={month} value={month.toString()}>
													{month} {month === 1 ? "month" : "months"}
												</SelectItem>
											),
										)}
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Calculated End Date Display */}
						{localStartDate &&
							calculatedEndDate &&
							(hasOverlap ? (
								<Alert variant="destructive">
									<AlertCircle className="h-4 w-4" />
									<AlertTitle className="font-semibold text-destructive">
										Booking Overlap Detected
									</AlertTitle>
									<AlertDescription className="text-destructive/95">
										<div className="mt-2 space-y-1.5">
											<p className="text-sm">
												<strong className="font-semibold">
													Booking Period:
												</strong>{" "}
												{format(localStartDate, "MMM d, yyyy")} -{" "}
												{format(calculatedEndDate, "MMM d, yyyy")}
											</p>
											<p className="text-sm">
												<strong className="font-semibold">Duration:</strong>{" "}
												{localMonths} {localMonths === 1 ? "month" : "months"} (
												{localMonths * 30} days)
											</p>
											<p className="mt-2 font-semibold text-sm">
												This booking overlaps with an existing slot. Please
												choose different dates.
											</p>
										</div>
									</AlertDescription>
								</Alert>
							) : (
								<Alert>
									<Info className="h-4 w-4 text-blue-600" />
									<AlertTitle className="font-semibold text-gray-900">
										Booking Period
									</AlertTitle>
									<AlertDescription className="text-gray-700">
										<div className="mt-2 space-y-1.5">
											<p className="text-sm">
												<strong className="font-semibold text-gray-900">
													Start:
												</strong>{" "}
												<span className="text-gray-800">
													{format(localStartDate, "MMM d, yyyy")}
												</span>
											</p>
											<p className="text-sm">
												<strong className="font-semibold text-gray-900">
													End:
												</strong>{" "}
												<span className="text-gray-800">
													{format(calculatedEndDate, "MMM d, yyyy")}
												</span>
											</p>
											<p className="text-sm">
												<strong className="font-semibold text-gray-900">
													Duration:
												</strong>{" "}
												<span className="text-gray-800">
													{localMonths} {localMonths === 1 ? "month" : "months"}{" "}
													({localMonths * 30} days)
												</span>
											</p>
										</div>
									</AlertDescription>
								</Alert>
							))}

						{!localStartDate && (
							<Alert>
								<Info className="h-4 w-4 text-blue-600" />
								<AlertTitle className="font-semibold text-gray-900">
									Start Date Required
								</AlertTitle>
								<AlertDescription className="text-gray-700">
									Please select a start date to continue.
								</AlertDescription>
							</Alert>
						)}

						<p className="text-gray-500 text-xs">
							Rates are calculated per month (30 days). You can book multiple
							consecutive months or create separate slots with gaps between
							them.
						</p>

						{/* Preferred Time Slot */}
						<div className="space-y-2">
							<Label
								className="font-medium text-gray-700 text-sm"
								htmlFor={`workspace-time-${index}`}
							>
								Preferred Time Slot (Optional)
							</Label>
							<Select
								onValueChange={(value) => {
									const currentNotes = (serviceItem.notes as string) || "";
									const dates = parseWorkspaceDates(serviceItem);
									if (dates.startDate && dates.endDate) {
										onUpdate({
											notes: updateWorkspaceNotes(currentNotes, {
												timeSlot: value,
											}),
										});
									}
								}}
								value={getWorkspaceTimeSlot(
									(serviceItem.notes as string) || "",
								)}
							>
								<SelectTrigger
									className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
									id={`workspace-time-${index}`}
								>
									<SelectValue placeholder="Select preferred time slot" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="morning">
										Morning (8:00 AM - 12:00 PM)
									</SelectItem>
									<SelectItem value="afternoon">
										Afternoon (12:00 PM - 5:00 PM)
									</SelectItem>
									<SelectItem value="full_day">
										Full Day (8:00 AM - 5:00 PM)
									</SelectItem>
									<SelectItem value="flexible">Flexible</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Purpose */}
						<div className="space-y-2">
							<Label
								className="font-medium text-gray-700 text-sm"
								htmlFor={`workspace-purpose-${index}`}
							>
								Purpose (Optional)
							</Label>
							<Textarea
								className="border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
								id={`workspace-purpose-${index}`}
								onChange={(e) => {
									const currentNotes = (serviceItem.notes as string) || "";
									const dates = parseWorkspaceDates(serviceItem);
									if (dates.startDate && dates.endDate) {
										onUpdate({
											notes: updateWorkspaceNotes(currentNotes, {
												purpose: e.target.value,
											}),
										});
									}
								}}
								placeholder="Describe the purpose of this workspace booking..."
								rows={3}
								value={getWorkspacePurpose((serviceItem.notes as string) || "")}
							/>
						</div>

						{/* Optional Add-Ons */}
						{addOns.length > 0 && (
							<div className="border-orange-200 border-l-2 pl-4">
								<h4 className="mb-4 flex items-center font-medium text-gray-900">
									<Sparkles className="mr-2 h-4 w-4" />
									Optional Add-Ons
								</h4>
								<div className="space-y-3">
									{addOns.map((addon) => (
										<div
											className="flex items-start space-x-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
											key={addon.id}
										>
											<Checkbox
												checked={selectedAddOnIds.includes(addon.id)}
												id={`workspace-addon-${addon.id}-${index}`}
												onCheckedChange={(checked) => {
													if (checked) {
														onUpdate({
															addOnIds: [...selectedAddOnIds, addon.id],
														});
													} else {
														onUpdate({
															addOnIds: selectedAddOnIds.filter(
																(id) => id !== addon.id,
															),
														});
													}
												}}
											/>
											<div className="flex-1">
												<Label
													className="font-medium text-gray-900 text-sm"
													htmlFor={`workspace-addon-${addon.id}-${index}`}
												>
													{addon.name}
												</Label>
												{addon.description && (
													<p className="text-gray-600 text-xs">
														{addon.description}
													</p>
												)}
											</div>
											<div className="text-right">
												<span className="font-semibold text-gray-900">
													RM {addon.effectiveAmount.toFixed(2)}
												</span>
												{addon.customAmount && (
													<p className="text-gray-500 text-xs line-through">
														RM {addon.defaultAmount.toFixed(2)}
													</p>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Equipment Needs */}
						<div className="border-purple-200 border-l-2 pl-4">
							<h4 className="mb-4 flex items-center font-medium text-gray-900">
								<div className="mr-2 h-2 w-2 rounded-full bg-purple-500"></div>
								Equipment Needs
							</h4>
							<EquipmentSelector
								availableEquipment={[]} // TODO: Fetch from API
								onEquipmentChange={(equipmentIds) => {
									onUpdate({ equipmentIds });
								}}
								onOtherEquipmentChange={(equipment) => {
									onUpdate({ otherEquipmentRequests: equipment });
								}}
								otherEquipmentRequests={
									(serviceItem.otherEquipmentRequests as string[]) || []
								}
								selectedEquipmentIds={
									(serviceItem.equipmentIds as string[]) || []
								}
							/>
						</div>

						{/* Additional Notes */}
						<div className="space-y-2">
							<Label
								className="font-medium text-gray-700 text-sm"
								htmlFor={`workspace-notes-${index}`}
							>
								Additional Notes (Optional)
							</Label>
							<Textarea
								className="border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
								id={`workspace-notes-${index}`}
								onChange={(e) => {
									const currentNotes = (serviceItem.notes as string) || "";
									const dates = parseWorkspaceDates(serviceItem);
									if (dates.startDate && dates.endDate) {
										onUpdate({
											notes: updateWorkspaceNotes(currentNotes, {
												additionalNotes: e.target.value,
											}),
										});
									}
								}}
								placeholder="Any additional notes or requirements..."
								rows={3}
								value={getWorkspaceAdditionalNotes(
									(serviceItem.notes as string) || "",
								)}
							/>
						</div>
					</div>
				</AccordionContentNoAutoClose>
			</AccordionItemNoAutoClose>
		</AccordionNoAutoClose>
	);
}
