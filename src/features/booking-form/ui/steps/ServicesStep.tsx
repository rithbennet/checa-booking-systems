"use client";

import { Plus } from "lucide-react";
import type { LabEquipment } from "@/entities/booking";
import type {
	BookingServiceItemInput,
	WorkspaceBookingInput,
} from "@/entities/booking/model/schemas";
import type { Service } from "@/entities/service";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";

import { ServiceGroupForm } from "../services/ServiceGroupForm";
import { WorkspaceGroupForm } from "../workspace/WorkspaceGroupForm";

interface ServicesStepProps {
	fields: Array<BookingServiceItemInput & { id: string }>;
	workspaceFields: Array<WorkspaceBookingInput & { id: string }>;
	workingSpaceService?: Service;
	getServiceForField: (serviceId: string) => Service | undefined;
	handleAddSample: (serviceId: string) => void;
	handleRemoveService: (index: number) => void;
	handleRemoveServiceGroup: (serviceId: string) => void;
	handleServiceUpdate: (
		index: number,
		data: Partial<BookingServiceItemInput>,
	) => void;
	handleAddWorkspace: () => void;
	handleWorkspaceUpdate: (
		index: number,
		data: Partial<WorkspaceBookingInput>,
	) => void;
	handleRemoveWorkspace: (index: number) => void;
	setServiceDialogOpen: (open: boolean) => void;
	availableEquipment: LabEquipment[];
}

export function ServicesStep({
	fields,
	workspaceFields,
	workingSpaceService,
	getServiceForField,
	handleAddSample,
	handleRemoveService,
	handleRemoveServiceGroup,
	handleServiceUpdate,
	handleAddWorkspace,
	handleWorkspaceUpdate,
	handleRemoveWorkspace,
	setServiceDialogOpen,
	availableEquipment,
}: ServicesStepProps) {
	// Workspace bookings are passed through directly to the workspace group form
	const workspaceItemsForGroup = workspaceFields.map((item, index) => ({ index, item }));

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-xl">Services & Details</CardTitle>
				<CardDescription>
					Add services and provide detailed information for each sample or
					workspace booking
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-8">
				{/* Selected Services */}
				<div>
					<h3 className="mb-4 font-semibold text-lg">Selected Services</h3>

					{fields.length === 0 ? (
						<div className="rounded-lg border-2 border-gray-300 border-dashed p-8 text-center">
							<p className="text-gray-500">
								No services selected. Click "Add Service" to get started.
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

							return (Object.entries(grouped) as [string, GroupedItems][]).map(
								([serviceId, serviceItems]) => {
									const service = getServiceForField(serviceId);
									if (!service) {
										return null;
									}

									return (
										<ServiceGroupForm
											availableEquipment={availableEquipment}
											key={serviceId}
											onAddSample={handleAddSample}
											onRemove={handleRemoveService}
											onRemoveGroup={handleRemoveServiceGroup}
											onUpdate={handleServiceUpdate}
											service={service}
											serviceItems={serviceItems}
										/>
									);
								},
							);
						})()
					)}

					<Button
						className="w-full border-2 border-gray-300 border-dashed py-4 text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
						onClick={() => setServiceDialogOpen(true)}
						type="button"
						variant="outline"
					>
						<Plus className="mr-2 h-4 w-4" />
						Add Service
					</Button>
				</div>

				{/* Workspace Bookings */}
				<div>
					<div className="mt-10 mb-4 flex items-center justify-between">
						<h3 className="font-semibold text-lg">Workspace bookings</h3>
						<Button
							className="border-2 border-gray-300 border-dashed text-gray-600 transition-colors hover:border-green-400 hover:bg-green-50 hover:text-green-600"
							onClick={handleAddWorkspace}
							type="button"
							variant="outline"
						>
							<Plus className="mr-2 h-4 w-4" /> Add Workspace
						</Button>
					</div>

					{workspaceFields.length === 0 ? (
						<div className="rounded-lg border-2 border-gray-300 border-dashed p-8 text-center">
							<p className="text-gray-500">
								No workspace bookings yet. Click "Add Workspace" to create one.
							</p>
						</div>
					) : (
						<WorkspaceGroupForm
							availableEquipment={availableEquipment}
							isEquipmentLoading={false}
							onAddSlot={handleAddWorkspace}
							onRemove={(i) => handleRemoveWorkspace(i)}
							onUpdate={(i, data) => handleWorkspaceUpdate(i, data)}
							service={
								(workingSpaceService as Service) ??
								({
									id: "working-space-placeholder",
									name: "Working Space",
									code: "WS",
									category: "working_space",
									description: "Workspace booking",
									addOns: [],
								} as unknown as Service)
							}
							workspaceItems={workspaceItemsForGroup}
						/>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
