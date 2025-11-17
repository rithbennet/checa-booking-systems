"use client";

import type { LabEquipment } from "@/entities/booking";
import type { CreateBookingInput } from "@/entities/booking/model/schemas";
import type { Service } from "@/entities/service";
import { Checkbox } from "@/shared/ui/shadcn/checkbox";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/shadcn/select";
import { Textarea } from "@/shared/ui/shadcn/textarea";
import {
	getFieldsForService,
	type ServiceCategory,
} from "../../lib/service-column-map";
import { EquipmentSelector } from "../helpers/EquipmentSelector";

type ServiceItem = NonNullable<CreateBookingInput["serviceItems"]>[number];

interface ServiceItemFormProps {
	service: Service;
	serviceItem: Partial<ServiceItem>;
	index: number;
	onUpdate: (data: Partial<ServiceItem>) => void;
	availableEquipment: LabEquipment[];
	isEquipmentLoading?: boolean;
}

export function ServiceItemForm({
	service,
	serviceItem,
	index,
	onUpdate,
	availableEquipment,
	isEquipmentLoading = false,
}: ServiceItemFormProps) {
	// Note: Workspace bookings are now handled separately via WorkspaceBookingForm

	// Note: Workspace bookings are now handled separately
	const isAnalysisService = true; // All service items are analysis services now
	const fields = getFieldsForService(service.category as ServiceCategory);

	// Get add-ons from service (already cached via TanStack Query)
	const allAddOns = service.addOns || [];
	// Filter to only show add-ons applicable to samples
	const addOns = allAddOns.filter(
		(addon) => addon.applicableTo === "sample" || addon.applicableTo === "both",
	);
	const selectedAddOnIds = (serviceItem.addOnCatalogIds as string[]) || [];

	return (
		<div className="space-y-6">
			{isAnalysisService && (
				<>
					{/* Sample Name */}
					<div className="space-y-2">
						<Label
							className="font-medium text-gray-700 text-sm"
							htmlFor={`sample-name-${index}`}
						>
							Sample Name <span className="text-red-500">*</span>
						</Label>
						<Input
							className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
							id={`sample-name-${index}`}
							onChange={(e) => {
								onUpdate({ sampleName: e.target.value });
							}}
							placeholder="e.g., Polymer A, Compound B, etc."
							value={(serviceItem.sampleName as string) || ""}
						/>
					</div>

					{/* Sample Type */}
					{fields.includes("sampleType") && (
						<div className="space-y-2">
							<Label
								className="font-medium text-gray-700 text-sm"
								htmlFor={`sample-type-${index}`}
							>
								Sample Type <span className="text-red-500">*</span>
							</Label>
							<Select
								onValueChange={(value) => {
									onUpdate({
										sampleType: value as
											| "liquid"
											| "solid"
											| "powder"
											| "solution",
									});
								}}
								value={(serviceItem.sampleType as string) || ""}
							>
								<SelectTrigger
									className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
									id={`sample-type-${index}`}
								>
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
					)}

					{/* Quantity */}
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
							onChange={(e) => {
								onUpdate({
									quantity: parseInt(e.target.value, 10) || 1,
								});
							}}
							placeholder="Enter quantity"
							type="number"
							value={(serviceItem.quantity || 1).toString()}
						/>
					</div>

					{/* Sample Details */}
					{fields.includes("sampleDetails") && (
						<div className="space-y-2">
							<Label
								className="font-medium text-gray-700 text-sm"
								htmlFor={`sample-details-${index}`}
							>
								Sample Details
							</Label>
							<Textarea
								className="border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
								id={`sample-details-${index}`}
								onChange={(e) => {
									onUpdate({ sampleDetails: e.target.value });
								}}
								placeholder="Describe the sample..."
								rows={3}
								value={(serviceItem.sampleDetails as string) || ""}
							/>
						</div>
					)}

					{/* Sample Hazard */}
					{fields.includes("sampleHazard") && (
						<div className="space-y-2">
							<Label
								className="font-medium text-gray-700 text-sm"
								htmlFor={`sample-hazard-${index}`}
							>
								Sample Hazard
							</Label>
							<Input
								className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
								id={`sample-hazard-${index}`}
								onChange={(e) => {
									onUpdate({ sampleHazard: e.target.value });
								}}
								placeholder="Hazard classification"
								value={(serviceItem.sampleHazard as string) || ""}
							/>
						</div>
					)}

					{/* Testing Method */}
					{fields.includes("testingMethod") && (
						<div className="space-y-2">
							<Label
								className="font-medium text-gray-700 text-sm"
								htmlFor={`testing-method-${index}`}
							>
								Testing Method
							</Label>
							<Textarea
								className="border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
								id={`testing-method-${index}`}
								onChange={(e) => {
									onUpdate({ testingMethod: e.target.value });
								}}
								placeholder="Specify testing method..."
								rows={3}
								value={(serviceItem.testingMethod as string) || ""}
							/>
						</div>
					)}

					{/* Wavelength */}
					{fields.includes("wavelength") && (
						<div className="space-y-2">
							<Label
								className="font-medium text-gray-700 text-sm"
								htmlFor={`wavelength-${index}`}
							>
								Wavelength (nm)
							</Label>
							<Input
								className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
								id={`wavelength-${index}`}
								min="1"
								onChange={(e) => {
									const val = parseInt(e.target.value, 10);
									onUpdate({
										wavelength: Number.isNaN(val) ? undefined : val,
									});
								}}
								placeholder="e.g., 254"
								type="number"
								value={serviceItem.wavelength?.toString() || ""}
							/>
						</div>
					)}

					{/* Degas Conditions */}
					{fields.includes("degasConditions") && (
						<div className="space-y-2">
							<Label
								className="font-medium text-gray-700 text-sm"
								htmlFor={`degas-conditions-${index}`}
							>
								Degas Conditions
							</Label>
							<Textarea
								className="border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
								id={`degas-conditions-${index}`}
								onChange={(e) => {
									onUpdate({ degasConditions: e.target.value });
								}}
								placeholder="Specify degas conditions..."
								rows={3}
								value={(serviceItem.degasConditions as string) || ""}
							/>
						</div>
					)}

					{/* Solvent System */}
					{fields.includes("solventSystem") && (
						<div className="space-y-2">
							<Label
								className="font-medium text-gray-700 text-sm"
								htmlFor={`solvent-system-${index}`}
							>
								Solvent System
							</Label>
							<Textarea
								className="border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
								id={`solvent-system-${index}`}
								onChange={(e) => {
									onUpdate({ solventSystem: e.target.value });
								}}
								placeholder="Specify solvent system..."
								rows={3}
								value={(serviceItem.solventSystem as string) || ""}
							/>
						</div>
					)}

					{/* Solvents */}
					{fields.includes("solvents") && (
						<div className="space-y-2">
							<Label
								className="font-medium text-gray-700 text-sm"
								htmlFor={`solvents-${index}`}
							>
								Solvents
							</Label>
							<Input
								className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
								id={`solvents-${index}`}
								onChange={(e) => {
									onUpdate({ solvents: e.target.value });
								}}
								placeholder="e.g., Methanol, Water"
								value={(serviceItem.solvents as string) || ""}
							/>
						</div>
					)}

					{/* Solvent Composition */}
					{fields.includes("solventComposition") && (
						<div className="space-y-2">
							<Label
								className="font-medium text-gray-700 text-sm"
								htmlFor={`solvent-composition-${index}`}
							>
								Solvent Composition
							</Label>
							<Input
								className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
								id={`solvent-composition-${index}`}
								onChange={(e) => {
									onUpdate({ solventComposition: e.target.value });
								}}
								placeholder="e.g., 70:30 Methanol:Water"
								value={(serviceItem.solventComposition as string) || ""}
							/>
						</div>
					)}

					{/* Column Type */}
					{fields.includes("columnType") && (
						<div className="space-y-2">
							<Label
								className="font-medium text-gray-700 text-sm"
								htmlFor={`column-type-${index}`}
							>
								Column Type
							</Label>
							<Input
								className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
								id={`column-type-${index}`}
								onChange={(e) => {
									onUpdate({ columnType: e.target.value });
								}}
								placeholder="e.g., C18, C8"
								value={(serviceItem.columnType as string) || ""}
							/>
						</div>
					)}

					{/* Flow Rate */}
					{fields.includes("flowRate") && (
						<div className="space-y-2">
							<Label
								className="font-medium text-gray-700 text-sm"
								htmlFor={`flow-rate-${index}`}
							>
								Flow Rate (mL/min)
							</Label>
							<Input
								className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
								id={`flow-rate-${index}`}
								min="0.1"
								onChange={(e) => {
									const val = parseFloat(e.target.value);
									onUpdate({
										flowRate: Number.isNaN(val) ? undefined : val,
									});
								}}
								placeholder="e.g., 1.0"
								step="0.1"
								type="number"
								value={serviceItem.flowRate?.toString() || ""}
							/>
						</div>
					)}

					{/* Expected Retention Time */}
					{fields.includes("expectedRetentionTime") && (
						<div className="space-y-2">
							<Label
								className="font-medium text-gray-700 text-sm"
								htmlFor={`retention-time-${index}`}
							>
								Expected Retention Time (min)
							</Label>
							<Input
								className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
								id={`retention-time-${index}`}
								min="0"
								onChange={(e) => {
									const val = parseFloat(e.target.value);
									onUpdate({
										expectedRetentionTime: Number.isNaN(val) ? undefined : val,
									});
								}}
								placeholder="e.g., 5.2"
								step="0.1"
								type="number"
								value={serviceItem.expectedRetentionTime?.toString() || ""}
							/>
						</div>
					)}

					{/* Sample Preparation */}
					{fields.includes("samplePreparation") && (
						<div className="space-y-2">
							<Label
								className="font-medium text-gray-700 text-sm"
								htmlFor={`sample-preparation-${index}`}
							>
								Sample Preparation
							</Label>
							<Textarea
								className="border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
								id={`sample-preparation-${index}`}
								onChange={(e) => {
									onUpdate({ samplePreparation: e.target.value });
								}}
								placeholder="Describe sample preparation method..."
								rows={3}
								value={(serviceItem.samplePreparation as string) || ""}
							/>
						</div>
					)}

					{/* Special Handling Requirements */}
					<div className="border-green-200 border-l-2 pl-4">
						<h4 className="mb-4 flex items-center font-medium text-gray-900">
							<div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
							Special Handling Requirements
						</h4>
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
							<div className="flex items-center space-x-2">
								<Checkbox
									checked={serviceItem.temperatureControlled || false}
									id={`temperature-${index}`}
									onCheckedChange={(checked) => {
										onUpdate({ temperatureControlled: checked === true });
									}}
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
									checked={serviceItem.lightSensitive || false}
									id={`light-${index}`}
									onCheckedChange={(checked) => {
										onUpdate({ lightSensitive: checked === true });
									}}
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
									checked={serviceItem.hazardousMaterial || false}
									id={`hazardous-${index}`}
									onCheckedChange={(checked) => {
										onUpdate({ hazardousMaterial: checked === true });
									}}
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
									checked={serviceItem.inertAtmosphere || false}
									id={`inert-${index}`}
									onCheckedChange={(checked) => {
										onUpdate({ inertAtmosphere: checked === true });
									}}
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

					{/* Special Instructions */}
					<div className="space-y-2">
						<Label
							className="font-medium text-gray-700 text-sm"
							htmlFor={`special-instructions-${index}`}
						>
							Special Instructions
						</Label>
						<Textarea
							className="border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
							id={`special-instructions-${index}`}
							onChange={(e) => {
								onUpdate({ notes: e.target.value });
							}}
							placeholder="Any special instructions for this sample..."
							rows={3}
							value={(serviceItem.notes as string) || ""}
						/>
					</div>
				</>
			)}

			{/* Optional Add-Ons */}
			{addOns.length > 0 && (
				<div className="border-orange-200 border-l-2 pl-4">
					<h4 className="mb-4 flex items-center font-medium text-gray-900">
						<div className="mr-2 h-2 w-2 rounded-full bg-orange-500"></div>
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
									id={`addon-${addon.id}-${index}`}
									onCheckedChange={(checked) => {
										if (checked) {
											onUpdate({
												addOnCatalogIds: [...selectedAddOnIds, addon.id],
											});
										} else {
											onUpdate({
												addOnCatalogIds: selectedAddOnIds.filter(
													(id) => id !== addon.id,
												),
											});
										}
									}}
								/>
								<div className="flex-1">
									<Label
										className="font-medium text-gray-900 text-sm"
										htmlFor={`addon-${addon.id}-${index}`}
									>
										{addon.name}
									</Label>
									{addon.description && (
										<p className="text-gray-600 text-xs">{addon.description}</p>
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

			{/* Equipment Needs - Available for all service types */}
			<div className="border-purple-200 border-l-2 pl-4">
				<h4 className="mb-4 flex items-center font-medium text-gray-900">
					<div className="mr-2 h-2 w-2 rounded-full bg-purple-500"></div>
					Equipment Needs
				</h4>
				<EquipmentSelector
					availableEquipment={availableEquipment}
					isLoading={isEquipmentLoading}
					onEquipmentChange={(equipmentIds) => {
						onUpdate({ equipmentIds });
					}}
					onOtherEquipmentChange={(equipment) => {
						onUpdate({ otherEquipmentRequests: equipment });
					}}
					otherEquipmentRequests={
						(serviceItem.otherEquipmentRequests as string[]) || []
					}
					selectedEquipmentIds={(serviceItem.equipmentIds as string[]) || []}
				/>
			</div>

			{/* Notes removed: Special Instructions already writes to notes; avoid duplication */}
		</div>
	);
}
