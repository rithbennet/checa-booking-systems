"use client";

import { X } from "lucide-react";
import { useState } from "react";
import type { LabEquipment } from "@/entities/booking";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import { Checkbox } from "@/shared/ui/shadcn/checkbox";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/shared/ui/shadcn/popover";

interface EquipmentSelectorProps {
    availableEquipment: LabEquipment[];
    selectedEquipmentIds: string[];
    otherEquipmentRequests?: string[];
    onEquipmentChange: (equipmentIds: string[]) => void;
    onOtherEquipmentChange?: (equipment: string[]) => void;
    disabled?: boolean;
    isLoading?: boolean;
}

export function EquipmentSelector({
    availableEquipment = [],
    selectedEquipmentIds,
    otherEquipmentRequests = [],
    onEquipmentChange,
    onOtherEquipmentChange,
    disabled = false,
    isLoading = false,
}: EquipmentSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [customEquipmentInput, setCustomEquipmentInput] = useState("");

    const handleToggleEquipment = (equipmentId: string) => {
        if (disabled) return;
        const isSelected = selectedEquipmentIds.includes(equipmentId);
        if (isSelected) {
            onEquipmentChange(
                selectedEquipmentIds.filter((id) => id !== equipmentId),
            );
        } else {
            onEquipmentChange([...selectedEquipmentIds, equipmentId]);
        }
    };

    const handleAddCustomEquipment = () => {
        if (!customEquipmentInput.trim() || disabled) return;
        const newEquipment = customEquipmentInput.trim();
        if (!otherEquipmentRequests.includes(newEquipment)) {
            onOtherEquipmentChange?.([...otherEquipmentRequests, newEquipment]);
        }
        setCustomEquipmentInput("");
    };

    const handleRemoveCustomEquipment = (equipment: string) => {
        if (disabled) return;
        onOtherEquipmentChange?.(
            otherEquipmentRequests.filter((e) => e !== equipment),
        );
    };

    const equipmentList = availableEquipment ?? [];
    const selectedEquipment = equipmentList.filter((eq) =>
        selectedEquipmentIds.includes(eq.id),
    );

    return (
        <div className="space-y-3">
            <Label className="font-medium text-gray-700 text-sm">
                Required Equipment
            </Label>

            {/* Selected Equipment Display */}
            {(selectedEquipment.length > 0 || otherEquipmentRequests.length > 0) && (
                <div className="flex flex-wrap gap-2">
                    {selectedEquipment.map((eq) => (
                        <Badge
                            className="bg-blue-100 text-blue-800"
                            key={eq.id}
                            variant="secondary"
                        >
                            {eq.name}
                            {!disabled && (
                                <button
                                    className="ml-1.5 rounded-full hover:bg-blue-200"
                                    onClick={() => handleToggleEquipment(eq.id)}
                                    type="button"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </Badge>
                    ))}
                    {otherEquipmentRequests.map((eq) => (
                        <Badge
                            className="bg-purple-100 text-purple-800"
                            key={`custom-${eq}`}
                            variant="secondary"
                        >
                            {eq} (Custom)
                            {!disabled && (
                                <button
                                    className="ml-1.5 rounded-full hover:bg-purple-200"
                                    onClick={() => handleRemoveCustomEquipment(eq)}
                                    type="button"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </Badge>
                    ))}
                </div>
            )}

            {/* Equipment Selection Popover */}
            <Popover onOpenChange={setIsOpen} open={isOpen}>
                <PopoverTrigger asChild>
                    <Button
                        className="w-full justify-start border-gray-300 text-left font-normal"
                        disabled={disabled}
                        type="button"
                        variant="outline"
                    >
                        {selectedEquipmentIds.length === 0 &&
                            otherEquipmentRequests.length === 0
                            ? "Select Equipment"
                            : `${selectedEquipmentIds.length + otherEquipmentRequests.length} selected`}
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80 p-0">
                    <div className="max-h-96 space-y-2 overflow-y-auto p-4">
                        {/* Available Equipment List */}
                        <div className="space-y-2">
                            <Label className="font-medium text-gray-700 text-sm">
                                Available Equipment
                            </Label>
                                    { (equipmentList.length === 0) ? (
                                        <div className="space-y-1">
                                            {isLoading ? (
                                                <p className="text-gray-500 text-sm">Loading equipment...</p>
                                            ) : (
                                                <p className="text-gray-500 text-sm">No equipment available</p>
                                            )}
                                        </div>
                                    ) : (
                                        equipmentList.map((equipment) => {
                                    const isSelected = selectedEquipmentIds.includes(
                                        equipment.id,
                                    );
                                    const isUnavailable = !equipment.isAvailable;

                                    return (
                                        <div
                                            className="flex items-start space-x-2 rounded-md p-2 hover:bg-gray-50"
                                            key={equipment.id}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                disabled={isUnavailable || disabled}
                                                id={`equipment-${equipment.id}`}
                                                onCheckedChange={() =>
                                                    handleToggleEquipment(equipment.id)
                                                }
                                            />
                                            <Label
                                                className="flex-1 cursor-pointer text-sm"
                                                htmlFor={`equipment-${equipment.id}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className={isUnavailable ? "text-gray-400" : ""}
                                                    >
                                                        {equipment.name}
                                                    </span>
                                                    {isUnavailable && (
                                                        <Badge
                                                            className="ml-2 bg-gray-100 text-gray-600"
                                                            variant="secondary"
                                                        >
                                                            Unavailable
                                                        </Badge>
                                                    )}
                                                </div>
                                                {equipment.description && (
                                                    <p className="text-gray-500 text-xs">
                                                        {equipment.description}
                                                    </p>
                                                )}
                                            </Label>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Custom Equipment Input */}
                        {onOtherEquipmentChange && (
                            <div className="border-gray-200 border-t pt-3">
                                <Label className="font-medium text-gray-700 text-sm">
                                    Custom Equipment
                                </Label>
                                <p className="mb-2 text-gray-500 text-xs">
                                    Add equipment not listed above
                                </p>
                                <div className="flex gap-2">
                                    <Input
                                        className="flex-1"
                                        disabled={disabled}
                                        onChange={(e) => setCustomEquipmentInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddCustomEquipment();
                                            }
                                        }}
                                        placeholder="e.g., Specialized centrifuge"
                                        value={customEquipmentInput}
                                    />
                                    <Button
                                        disabled={!customEquipmentInput.trim() || disabled}
                                        onClick={handleAddCustomEquipment}
                                        size="sm"
                                        type="button"
                                    >
                                        Add
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
