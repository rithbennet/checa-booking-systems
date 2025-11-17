"use client";

import { differenceInDays } from "date-fns";
import { CheckCircle2, Circle, Plus, X } from "lucide-react";
import type { LabEquipment } from "@/entities/booking";
import type { CreateBookingInput } from "@/entities/booking/model/schemas";
import type { Service } from "@/entities/service";
import {
	AccordionContentNoAutoClose,
	AccordionItemNoAutoClose,
	AccordionNoAutoClose,
	AccordionTriggerNoAutoClose,
} from "@/shared/ui/shadcn/accordion-no-auto-close";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import { WorkspaceSlotForm } from "../workspace/WorkspaceSlotForm";
import { ServiceItemForm } from "./ServiceItemForm";

type ServiceItem = NonNullable<CreateBookingInput["serviceItems"]>[number];

interface ServiceGroupFormProps {
	service: Service;
	serviceItems: Array<{
		index: number;
		item: Partial<ServiceItem>;
	}>;
	onUpdate: (index: number, data: Partial<ServiceItem>) => void;
	onRemove: (index: number) => void;
	onRemoveGroup?: (serviceId: string) => void;
	onAddSample?: (serviceId: string) => void;
	availableEquipment: LabEquipment[];
	isEquipmentLoading?: boolean;
}

export function ServiceGroupForm({
	service,
	serviceItems,
	onUpdate,
	onRemove,
	onRemoveGroup,
	onAddSample,
	availableEquipment,
	isEquipmentLoading = false,
}: ServiceGroupFormProps) {
	const isWorkingSpace = service.category === "working_space";
	const isAnalysisService = !isWorkingSpace;

	// Check if all samples/slots are complete
	// No memoization needed - small dataset, simple checks, component re-renders when serviceItems changes
	const allComplete = serviceItems.every(({ item }) => {
		if (isAnalysisService) {
			return (
				!!item.sampleName &&
				item.sampleName.trim() !== "" &&
				!!item.sampleType &&
				!!item.quantity &&
				item.quantity > 0
			);
		} else {
			// Workspace slots: must have start and end dates with minimum 30 days duration
			const notes = (item.notes as string) || "";
			const startMatch = notes.match(/START_DATE:([^|]+)/);
			const endMatch = notes.match(/END_DATE:([^|]+)/);
			if (startMatch && endMatch && startMatch[1] && endMatch[1]) {
				const start = new Date(startMatch[1]);
				const end = new Date(endMatch[1]);
				const days = differenceInDays(end, start) + 1;
				return days >= 30 && end >= start;
			}
			// Backward compatibility
			return !!item.expectedCompletionDate && (item.durationMonths || 0) >= 1;
		}
	});

	const handleAddSample = () => {
		if (onAddSample) {
			onAddSample(service.id);
		}
	};

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
							{isAnalysisService ? (
								<span className="ml-2">
									• {serviceItems.length}{" "}
									{serviceItems.length === 1 ? "sample" : "samples"}
								</span>
							) : (
								<span className="ml-2">
									• {serviceItems.length}{" "}
									{serviceItems.length === 1 ? "month slot" : "month slots"}
								</span>
							)}
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						{allComplete && (
							<Badge className="bg-green-100 text-green-800" variant="default">
								All Complete
							</Badge>
						)}
						{onRemoveGroup && (
							<Button
								onClick={(e) => {
									e.stopPropagation();
									onRemoveGroup(service.id);
								}}
								size="sm"
								type="button"
								variant="ghost"
							>
								<X className="h-4 w-4" />
							</Button>
						)}
					</div>
				</div>
			</CardHeader>
			<CardContent className="p-0">
				<div className="px-6 pb-6">
					{isAnalysisService ? (
						<div className="space-y-4">
							<AccordionNoAutoClose className="w-full" type="multiple">
								{serviceItems.map(({ index, item }) => {
									const isComplete =
										!!item.sampleName &&
										item.sampleName.trim() !== "" &&
										!!item.sampleType &&
										!!item.quantity &&
										item.quantity > 0;

									const sampleName =
										(item.sampleName as string)?.trim() || "New Sample";

									return (
										<AccordionItemNoAutoClose
											className="border-0"
											key={`sample-${index}`}
											value={`sample-${index}`}
										>
											<div className="flex items-center justify-between px-4 py-3">
												{/* Accordion clickable area */}
												<AccordionTriggerNoAutoClose className="flex flex-1 items-center justify-between hover:no-underline focus:outline-none">
													<div className="flex items-center gap-3">
														{isComplete ? (
															<CheckCircle2 className="h-5 w-5 text-green-600" />
														) : (
															<Circle className="h-5 w-5 text-gray-400" />
														)}
														<span className="font-medium text-gray-900">
															{sampleName}
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
												{serviceItems.length > 1 && (
													<Button
														className="ml-2 h-8 w-8 shrink-0 rounded-md text-gray-500 hover:bg-red-50 hover:text-red-600"
														onClick={() => onRemove(index)}
														size="icon"
														title="Remove sample"
														variant="ghost"
													>
														<X className="h-4 w-4" />
													</Button>
												)}
											</div>
											<AccordionContentNoAutoClose className="px-4 pb-4">
												<ServiceItemForm
													availableEquipment={availableEquipment}
													index={index}
													isEquipmentLoading={isEquipmentLoading}
													onUpdate={(data) => onUpdate(index, data)}
													service={service}
													serviceItem={item}
												/>
											</AccordionContentNoAutoClose>
										</AccordionItemNoAutoClose>
									);
								})}
							</AccordionNoAutoClose>

							{onAddSample && (
								<Button
									className="w-full border-2 border-gray-300 border-dashed py-4 text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
									onClick={handleAddSample}
									type="button"
									variant="outline"
								>
									<Plus className="mr-2 h-4 w-4" />
									Add Another Sample
								</Button>
							)}
						</div>
					) : (
						<div className="space-y-4">
							<AccordionNoAutoClose className="w-full" type="multiple">
								{serviceItems.map(({ index, item }) => (
									<WorkspaceSlotForm
										allSlots={serviceItems.map(({ item }) => item)}
										availableEquipment={availableEquipment}
										excludeIndex={index}
										index={index}
										isEquipmentLoading={isEquipmentLoading}
										key={index}
										onRemove={onRemove}
										onUpdate={(data) => onUpdate(index, data)}
										service={service}
										serviceItem={item}
										totalSlots={serviceItems.length}
									/>
								))}
							</AccordionNoAutoClose>

							{onAddSample && (
								<Button
									className="w-full border-2 border-gray-300 border-dashed py-4 text-gray-600 transition-colors hover:border-green-400 hover:bg-green-50 hover:text-green-600"
									onClick={handleAddSample}
									type="button"
									variant="outline"
								>
									<Plus className="mr-2 h-4 w-4" />
									Add Another Month Slot
								</Button>
							)}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
