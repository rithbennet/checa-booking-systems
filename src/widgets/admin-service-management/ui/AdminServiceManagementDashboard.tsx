/**
 * Admin Service Management Dashboard
 *
 * Unified widget with tabs for managing services and equipment
 */

"use client";

import { Beaker, Settings2, Tags } from "lucide-react";
import { useState } from "react";
import {
	AddOnFormSheet,
	AddOnTable,
} from "@/features/services/admin/management/addons";
import {
	EquipmentFormSheet,
	EquipmentTable,
} from "@/features/services/admin/management/equipment";
import {
	ServiceFormSheet,
	ServiceTable,
} from "@/features/services/admin/management/services";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/ui/shadcn/tabs";

type TabValue = "services" | "equipment" | "addons";

export function AdminServiceManagementDashboard() {
	// Active tab state
	const [activeTab, setActiveTab] = useState<TabValue>("services");

	// Service sheet state
	const [isServiceSheetOpen, setIsServiceSheetOpen] = useState(false);
	const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

	// Equipment sheet state
	const [isEquipmentSheetOpen, setIsEquipmentSheetOpen] = useState(false);
	const [editingEquipmentId, setEditingEquipmentId] = useState<string | null>(
		null,
	);

	// Add-on sheet state
	const [isAddOnSheetOpen, setIsAddOnSheetOpen] = useState(false);
	const [editingAddOnId, setEditingAddOnId] = useState<string | null>(null);

	// Service handlers
	const handleCreateService = () => {
		setEditingServiceId(null);
		setIsServiceSheetOpen(true);
	};

	const handleEditService = (serviceId: string) => {
		setEditingServiceId(serviceId);
		setIsServiceSheetOpen(true);
	};

	const handleServiceSheetChange = (open: boolean) => {
		setIsServiceSheetOpen(open);
		if (!open) {
			setEditingServiceId(null);
		}
	};

	// Equipment handlers
	const handleCreateEquipment = () => {
		setEditingEquipmentId(null);
		setIsEquipmentSheetOpen(true);
	};

	const handleEditEquipment = (equipmentId: string) => {
		setEditingEquipmentId(equipmentId);
		setIsEquipmentSheetOpen(true);
	};

	const handleEquipmentSheetChange = (open: boolean) => {
		setIsEquipmentSheetOpen(open);
		if (!open) {
			setEditingEquipmentId(null);
		}
	};

	// Add-on handlers
	const handleCreateAddOn = () => {
		setEditingAddOnId(null);
		setIsAddOnSheetOpen(true);
	};

	const handleEditAddOn = (addOnId: string) => {
		setEditingAddOnId(addOnId);
		setIsAddOnSheetOpen(true);
	};

	const handleAddOnSheetChange = (open: boolean) => {
		setIsAddOnSheetOpen(open);
		if (!open) {
			setEditingAddOnId(null);
		}
	};

	return (
		<>
			{/* Page Header */}
			<div className="space-y-1">
				<h1 className="font-bold text-2xl tracking-tight">
					Service Management
				</h1>
				<p className="text-muted-foreground">
					Manage laboratory services, pricing, add-ons, and equipment.
				</p>
			</div>

			{/* Tabs */}
			<Tabs
				onValueChange={(value) => setActiveTab(value as TabValue)}
				value={activeTab}
			>
				<TabsList className="grid w-full max-w-2xl grid-cols-3">
					<TabsTrigger className="gap-2" value="services">
						<Settings2 className="size-4" />
						Services
					</TabsTrigger>
					<TabsTrigger className="gap-2" value="equipment">
						<Beaker className="size-4" />
						Equipment
					</TabsTrigger>
					<TabsTrigger className="gap-2" value="addons">
						<Tags className="size-4" />
						Add-ons
					</TabsTrigger>
				</TabsList>

				<TabsContent className="mt-6" value="services">
					<ServiceTable
						onCreate={handleCreateService}
						onEdit={handleEditService}
					/>
				</TabsContent>

				<TabsContent className="mt-6" value="equipment">
					<EquipmentTable
						onCreate={handleCreateEquipment}
						onEdit={handleEditEquipment}
					/>
				</TabsContent>

				<TabsContent className="mt-6" value="addons">
					<AddOnTable onCreate={handleCreateAddOn} onEdit={handleEditAddOn} />
				</TabsContent>
			</Tabs>

			{/* Service Form Sheet */}
			<ServiceFormSheet
				onOpenChange={handleServiceSheetChange}
				open={isServiceSheetOpen}
				serviceId={editingServiceId}
			/>

			{/* Equipment Form Sheet */}
			<EquipmentFormSheet
				equipmentId={editingEquipmentId}
				onOpenChange={handleEquipmentSheetChange}
				open={isEquipmentSheetOpen}
			/>

			{/* Add-on Form Sheet */}
			<AddOnFormSheet
				addOnId={editingAddOnId}
				onOpenChange={handleAddOnSheetChange}
				open={isAddOnSheetOpen}
			/>
		</>
	);
}
