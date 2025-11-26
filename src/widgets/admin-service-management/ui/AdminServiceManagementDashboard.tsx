/**
 * Admin Service Management Dashboard
 *
 * Unified widget with tabs for managing services and equipment
 */

"use client";

import { Beaker, Settings2 } from "lucide-react";
import { useState } from "react";
import {
	EquipmentFormSheet,
	EquipmentTable,
} from "@/features/admin/service-management/equipment";
import {
	ServiceFormSheet,
	ServiceTable,
} from "@/features/admin/service-management/services";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/ui/shadcn/tabs";

type TabValue = "services" | "equipment";

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

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div>
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
				<TabsList className="grid w-full max-w-md grid-cols-2">
					<TabsTrigger className="gap-2" value="services">
						<Settings2 className="size-4" />
						Services
					</TabsTrigger>
					<TabsTrigger className="gap-2" value="equipment">
						<Beaker className="size-4" />
						Equipment
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
		</div>
	);
}
