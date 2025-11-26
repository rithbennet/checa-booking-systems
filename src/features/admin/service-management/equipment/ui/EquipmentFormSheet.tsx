/**
 * Equipment Form Sheet
 *
 * Side sheet for creating/editing lab equipment
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
	useAdminEquipmentDetail,
	useUpsertEquipment,
} from "@/entities/lab-equipment";
import { Button } from "@/shared/ui/shadcn/button";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/shared/ui/shadcn/sheet";
import { Switch } from "@/shared/ui/shadcn/switch";
import { Textarea } from "@/shared/ui/shadcn/textarea";
import {
	type EquipmentFormValues,
	equipmentFormSchema,
} from "../model/form-schema";

interface EquipmentFormSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	equipmentId?: string | null;
}

export function EquipmentFormSheet({
	open,
	onOpenChange,
	equipmentId,
}: EquipmentFormSheetProps) {
	const isEditing = !!equipmentId;

	// Fetch equipment detail if editing
	const { data: equipmentDetail, isLoading: isLoadingDetail } =
		useAdminEquipmentDetail(equipmentId ?? null);

	// Upsert mutation
	const upsertMutation = useUpsertEquipment();

	// Form setup
	const form = useForm<EquipmentFormValues>({
		resolver: zodResolver(equipmentFormSchema),
		defaultValues: {
			name: "",
			description: "",
			isAvailable: true,
			maintenanceNotes: "",
			expectedMaintenanceEnd: "",
		},
	});

	// Reset form when equipment detail changes
	useEffect(() => {
		if (equipmentDetail && isEditing) {
			form.reset({
				id: equipmentDetail.id,
				name: equipmentDetail.name,
				description: equipmentDetail.description ?? "",
				isAvailable: equipmentDetail.isAvailable,
				maintenanceNotes: equipmentDetail.maintenanceNotes ?? "",
				expectedMaintenanceEnd: equipmentDetail.expectedMaintenanceEnd
					? equipmentDetail.expectedMaintenanceEnd.split("T")[0]
					: "",
			});
		} else if (!isEditing) {
			form.reset({
				name: "",
				description: "",
				isAvailable: true,
				maintenanceNotes: "",
				expectedMaintenanceEnd: "",
			});
		}
	}, [equipmentDetail, isEditing, form]);

	// Handle submit
	const onSubmit = async (values: EquipmentFormValues) => {
		try {
			await upsertMutation.mutateAsync({
				...values,
				id: equipmentId ?? undefined,
				expectedMaintenanceEnd: values.expectedMaintenanceEnd || null,
			});
			onOpenChange(false);
		} catch (error) {
			console.error("Failed to save equipment:", error);
		}
	};

	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			<SheetContent className="w-full overflow-y-auto sm:max-w-md">
				<SheetHeader>
					<SheetTitle>
						{isEditing ? "Edit Equipment" : "Add New Equipment"}
					</SheetTitle>
					<SheetDescription>
						{isEditing
							? "Update the equipment details and availability."
							: "Add new lab equipment to the inventory."}
					</SheetDescription>
				</SheetHeader>

				{isLoadingDetail ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="size-8 animate-spin text-muted-foreground" />
					</div>
				) : (
					<form
						className="space-y-6 py-4"
						onSubmit={form.handleSubmit(onSubmit)}
					>
						{/* Equipment Name */}
						<div className="space-y-2">
							<Label htmlFor="name">Name *</Label>
							<Input
								id="name"
								placeholder="Equipment name"
								{...form.register("name")}
							/>
							{form.formState.errors.name && (
								<p className="text-destructive text-xs">
									{form.formState.errors.name.message}
								</p>
							)}
						</div>

						{/* Description */}
						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								placeholder="Equipment description..."
								rows={3}
								{...form.register("description")}
							/>
						</div>

						{/* Availability Toggle */}
						<div className="flex items-center gap-3 rounded-lg border p-4">
							<Switch
								checked={form.watch("isAvailable")}
								id="isAvailable"
								onCheckedChange={(checked) =>
									form.setValue("isAvailable", checked)
								}
							/>
							<div>
								<Label className="font-medium" htmlFor="isAvailable">
									Available
								</Label>
								<p className="text-muted-foreground text-xs">
									Equipment is available for booking when enabled
								</p>
							</div>
						</div>

						{/* Maintenance Section */}
						<div className="space-y-4 rounded-lg border p-4">
							<h4 className="font-medium text-sm">Maintenance Information</h4>

							<div className="space-y-2">
								<Label htmlFor="maintenanceNotes">Maintenance Notes</Label>
								<Textarea
									id="maintenanceNotes"
									placeholder="Notes about maintenance status, issues, etc."
									rows={3}
									{...form.register("maintenanceNotes")}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="expectedMaintenanceEnd">
									Expected Maintenance End Date
								</Label>
								<Input
									id="expectedMaintenanceEnd"
									type="date"
									{...form.register("expectedMaintenanceEnd")}
								/>
								<p className="text-muted-foreground text-xs">
									When the equipment is expected to be back in service
								</p>
							</div>
						</div>

						<SheetFooter>
							<Button
								onClick={() => onOpenChange(false)}
								type="button"
								variant="outline"
							>
								Cancel
							</Button>
							<Button disabled={upsertMutation.isPending} type="submit">
								{upsertMutation.isPending && (
									<Loader2 className="mr-2 size-4 animate-spin" />
								)}
								{isEditing ? "Update Equipment" : "Add Equipment"}
							</Button>
						</SheetFooter>
					</form>
				)}
			</SheetContent>
		</Sheet>
	);
}
