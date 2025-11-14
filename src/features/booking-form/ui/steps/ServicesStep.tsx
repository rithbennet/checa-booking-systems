"use client";

import { Plus } from "lucide-react";
import type { LabEquipment } from "@/entities/booking";
import type { BookingServiceItemInput } from "@/entities/booking/model/schemas";
import type { Service } from "@/entities/service";
import { Button } from "@/shared/ui/shadcn/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/ui/shadcn/card";
import { ServiceGroupForm } from "../ServiceGroupForm";

interface ServicesStepProps {
    fields: Array<BookingServiceItemInput & { id: string }>;
    getServiceForField: (serviceId: string) => Service | undefined;
    handleAddSample: (serviceId: string) => void;
    handleRemoveService: (index: number) => void;
    handleRemoveServiceGroup: (serviceId: string) => void;
    handleServiceUpdate: (
        index: number,
        data: Partial<BookingServiceItemInput>
    ) => void;
    setServiceDialogOpen: (open: boolean) => void;
    availableEquipment: LabEquipment[];
}

export function ServicesStep({
    fields,
    getServiceForField,
    handleAddSample,
    handleRemoveService,
    handleRemoveServiceGroup,
    handleServiceUpdate,
    setServiceDialogOpen,
    availableEquipment,
}: ServicesStepProps) {
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
            </CardContent>
        </Card>
    );
}
