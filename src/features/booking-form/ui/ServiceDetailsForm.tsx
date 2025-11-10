"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
import type { BookingServiceItem } from "@/entities/booking";
import type { Service } from "@/entities/service";
import type { ServiceDetailsFormData } from "../model/types";

interface ServiceDetailsFormProps {
	service: Service;
	serviceItem: BookingServiceItem;
	index: number;
	onUpdate: (index: number, data: Partial<ServiceDetailsFormData>) => void;
	onRemove: (index: number) => void;
}

export function ServiceDetailsForm({
	service,
	serviceItem,
	index,
	onUpdate,
	onRemove,
}: ServiceDetailsFormProps) {
	const [startDate, setStartDate] = useState<Date | undefined>(
		serviceItem.startDate,
	);
	const [endDate, setEndDate] = useState<Date | undefined>(serviceItem.endDate);

	const isWorkingSpace = service.category === "working_space";
	const isAnalysisService = !isWorkingSpace;

	return (
		<Card className="mb-6 border-l-4 border-l-blue-500 shadow-sm">
			<CardHeader className="pb-4">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<CardTitle className="font-semibold text-gray-900 text-lg">
							{service.name}
						</CardTitle>
						<CardDescription className="mt-1 text-gray-600 text-sm">
							{service.code}
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				{isAnalysisService && (
					<div className="space-y-6">
						{/* Sample Details */}
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
										Sample Type <span className="text-red-500">*</span>
									</Label>
									<Select
										onValueChange={(value) =>
											onUpdate(index, { sampleType: value })
										}
										value={serviceItem.sampleType}
									>
										<SelectTrigger className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500">
											<SelectValue placeholder="Select sample type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="liquid">Liquid</SelectItem>
											<SelectItem value="solid">Solid</SelectItem>
											<SelectItem value="powder">Powder</SelectItem>
											<SelectItem value="solution">Solution</SelectItem>
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
										onChange={(e) =>
											onUpdate(index, {
												quantity: parseInt(e.target.value) || 1,
											})
										}
										placeholder="Enter quantity"
										type="number"
										value={serviceItem.quantity || ""}
									/>
								</div>
							</div>

							{/* HPLC Preparation */}
							{service.category === "hplc_pda" && (
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
										<Checkbox
											checked={serviceItem.hplcPreparationRequired}
											id={`hplc-prep-${index}`}
											onCheckedChange={(checked) =>
												onUpdate(index, {
													hplcPreparationRequired: checked === true,
												})
											}
										/>
										<Label
											className="text-gray-600 text-sm"
											htmlFor={`hplc-prep-${index}`}
										>
											Filter and HPLC vial preparation required
										</Label>
									</div>
								</div>
							)}

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
									onChange={(e) =>
										onUpdate(index, { samplePreparation: e.target.value })
									}
									placeholder="Describe any additional sample preparation methods..."
									rows={3}
									value={serviceItem.samplePreparation || ""}
								/>
							</div>
						</div>

						{/* Special Handling Requirements */}
						<div className="border-green-200 border-l-2 pl-4">
							<h4 className="mb-4 flex items-center font-medium text-gray-900">
								<div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
								Special Handling Requirements
							</h4>
							<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
								<div className="flex items-center space-x-2">
									<Checkbox
										checked={serviceItem.temperatureControlled}
										id={`temperature-${index}`}
										onCheckedChange={(checked) =>
											onUpdate(index, {
												temperatureControlled: checked === true,
											})
										}
									/>
									<Label
										className="text-gray-600 text-sm"
										htmlFor={`temperature-${index}`}
									>
										Temperature controlled storage
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<Checkbox
										checked={serviceItem.lightSensitive}
										id={`light-${index}`}
										onCheckedChange={(checked) =>
											onUpdate(index, { lightSensitive: checked === true })
										}
									/>
									<Label
										className="text-gray-600 text-sm"
										htmlFor={`light-${index}`}
									>
										Light sensitive
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<Checkbox
										checked={serviceItem.hazardousMaterial}
										id={`hazardous-${index}`}
										onCheckedChange={(checked) =>
											onUpdate(index, {
												hazardousMaterial: checked === true,
											})
										}
									/>
									<Label
										className="text-gray-600 text-sm"
										htmlFor={`hazardous-${index}`}
									>
										Hazardous material
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<Checkbox
										checked={serviceItem.inertAtmosphere}
										id={`inert-${index}`}
										onCheckedChange={(checked) =>
											onUpdate(index, {
												inertAtmosphere: checked === true,
											})
										}
									/>
									<Label
										className="text-gray-600 text-sm"
										htmlFor={`inert-${index}`}
									>
										Inert atmosphere required
									</Label>
								</div>
							</div>
						</div>

						{/* Technical Requirements */}
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
									onChange={(e) =>
										onUpdate(index, { testingMethod: e.target.value })
									}
									placeholder="Specify solvent compatibility, column type, detection wavelength, flow rate, injection volume, etc."
									rows={4}
									value={serviceItem.testingMethod || ""}
								/>
							</div>
						</div>
					</div>
				)}

				{isWorkingSpace && (
					<div className="space-y-6">
						{/* Booking Details */}
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
											onChange={(e) =>
												onUpdate(index, {
													durationMonths: parseInt(e.target.value) || 1,
												})
											}
											placeholder="Enter duration"
											type="number"
											value={serviceItem.durationMonths || ""}
										/>
										<Select
											onValueChange={(value) => {
												// Handle unit conversion if needed
											}}
											value="months"
										>
											<SelectTrigger className="w-28 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
												<SelectValue placeholder="Unit" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="months">Months</SelectItem>
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

						{/* Preferred Dates & Times */}
						<div className="border-green-200 border-l-2 pl-4">
							<h4 className="mb-4 flex items-center font-medium text-gray-900">
								<div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
								Preferred Dates & Times
							</h4>
							<div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label className="font-medium text-gray-700 text-sm">
										Start Date <span className="text-red-500">*</span>
									</Label>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												className="w-full justify-start border-gray-300 text-left font-normal focus:border-blue-500 focus:ring-blue-500"
												variant="outline"
											>
												<CalendarIcon className="mr-2 h-4 w-4" />
												{startDate ? format(startDate, "PPP") : "Pick a date"}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0">
											<Calendar
												initialFocus
												mode="single"
												onSelect={(date) => {
													setStartDate(date);
													onUpdate(index, { startDate: date });
												}}
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
												{endDate ? format(endDate, "PPP") : "Pick a date"}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0">
											<Calendar
												initialFocus
												mode="single"
												onSelect={(date) => {
													setEndDate(date);
													onUpdate(index, { endDate: date });
												}}
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
									<Select
										onValueChange={(value) =>
											onUpdate(index, { preferredTimeSlot: value })
										}
										value={serviceItem.preferredTimeSlot}
									>
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
							</div>
						</div>

						{/* Equipment Needs */}
						<div className="border-purple-200 border-l-2 pl-4">
							<h4 className="mb-4 flex items-center font-medium text-gray-900">
								<div className="mr-2 h-2 w-2 rounded-full bg-purple-500"></div>
								Equipment Needs
							</h4>
							<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
								{[
									{ key: "fumeHood", label: "Fume Hood" },
									{ key: "analyticalBalance", label: "Analytical Balance" },
									{ key: "heatingEquipment", label: "Heating Equipment" },
									{ key: "magneticStirrer", label: "Magnetic Stirrer" },
									{ key: "rotaryEvaporator", label: "Rotary Evaporator" },
									{ key: "vacuumSystem", label: "Vacuum System" },
								].map(({ key, label }) => (
									<div className="flex items-center space-x-2" key={key}>
										<Checkbox
											checked={
												serviceItem[key as keyof BookingServiceItem] as boolean
											}
											id={`${key}-${index}`}
											onCheckedChange={(checked) =>
												onUpdate(index, { [key]: checked === true })
											}
										/>
										<Label
											className="text-gray-600 text-sm"
											htmlFor={`${key}-${index}`}
										>
											{label}
										</Label>
									</div>
								))}
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
									onChange={(e) =>
										onUpdate(index, {
											otherEquipmentRequirements: e.target.value,
										})
									}
									placeholder="Specify any additional equipment or special requirements..."
									rows={2}
									value={serviceItem.otherEquipmentRequirements || ""}
								/>
							</div>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

