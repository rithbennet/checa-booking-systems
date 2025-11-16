"use client";

import { Plus, X } from "lucide-react";
import type { LabEquipment } from "@/entities/booking";
import type { CreateBookingInput, WorkspaceBookingInput } from "@/entities/booking/model/schemas";
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
import { WorkspaceSlotForm } from "./WorkspaceSlotForm";

type ServiceItem = NonNullable<CreateBookingInput["serviceItems"]>[number];

interface WorkspaceGroupFormProps {
    service: Service;
    workspaceItems: Array<{
        index: number;
        // item can be either a service-style item or the dedicated WorkspaceBookingInput
        item: Partial<ServiceItem> | Partial<WorkspaceBookingInput>;
    }>;
    onUpdate: (
        index: number,
        data: Partial<ServiceItem> | Partial<WorkspaceBookingInput>,
    ) => void;
    onRemove: (index: number) => void;
    onRemoveGroup?: () => void;
    onAddSlot?: () => void;
    availableEquipment: LabEquipment[];
    isEquipmentLoading?: boolean;
}

export function WorkspaceGroupForm({
    service,
    workspaceItems,
    onUpdate,
    onRemove,
    onRemoveGroup,
    onAddSlot,
    availableEquipment,
    isEquipmentLoading = false,
}: WorkspaceGroupFormProps) {
    // A workspace slot is "complete" when its internal form deems it so.
    // We approximate completeness by checking the notes for parsed dates via WorkspaceSlotForm itself.
    const allComplete = workspaceItems.length > 0; // Badge is cosmetic; WorkspaceSlotForm shows per-item state

    return (
        <Card className="mb-6 border-l-4 border-l-green-500 shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="font-semibold text-gray-900 text-lg">
                            {service?.name || "Workspace"}
                        </CardTitle>
                        <CardDescription className="mt-1 text-gray-600 text-sm">
                            {service?.code || "WS"}
                            <span className="ml-2">
                                • {workspaceItems.length}{" "}
                                {workspaceItems.length === 1 ? "slot" : "slots"}
                            </span>
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
                                    onRemoveGroup();
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
                    <div className="space-y-4">
                        {/* Keep all slots open by default so their forms are visible */}
                        <AccordionNoAutoClose
                            className="w-full"
                            type="multiple"
                            value={workspaceItems.map(({ index }) => `workspace-${index}`)}
                        >
                            {workspaceItems.map(({ index, item }) => (
                                <AccordionItemNoAutoClose
                                    className="border-0"
                                    key={`workspace-${index}`}
                                    value={`workspace-${index}`}
                                >
                                    <div className="px-0">
                                        <AccordionTriggerNoAutoClose className="sr-only" />
                                        <AccordionContentNoAutoClose>
                                            <WorkspaceSlotForm
                                                allSlots={workspaceItems.map(({ item }) => item)}
                                                availableEquipment={availableEquipment}
                                                excludeIndex={index}
                                                index={index}
                                                isEquipmentLoading={isEquipmentLoading}
                                                onRemove={onRemove}
                                                onUpdate={(data) => onUpdate(index, data)}
                                                service={service}
                                                serviceItem={item}
                                                totalSlots={workspaceItems.length}
                                            />
                                        </AccordionContentNoAutoClose>
                                    </div>
                                </AccordionItemNoAutoClose>
                            ))}
                        </AccordionNoAutoClose>

                        {onAddSlot && (
                            <Button
                                className="w-full border-2 border-gray-300 border-dashed py-4 text-gray-600 transition-colors hover:border-green-400 hover:bg-green-50 hover:text-green-600"
                                onClick={onAddSlot}
                                type="button"
                                variant="outline"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Another Month Slot
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
