/**
 * Add-On Form Sheet
 *
 * Side sheet for creating/editing global add-ons
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
	type AddOnUpsertInput,
	useAllGlobalAddOns,
	useUpsertAddOn,
} from "@/entities/addon";
import { Button } from "@/shared/ui/shadcn/button";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/shadcn/select";
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
	type AddOnFormValues,
	addOnFormSchema,
	applicableToLabels,
} from "../model/form-schema";

interface AddOnFormSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	addOnId?: string | null;
}

export function AddOnFormSheet({
	open,
	onOpenChange,
	addOnId,
}: AddOnFormSheetProps) {
	const isEditing = !!addOnId;

	// Fetch all add-ons to find the one we're editing
	const { data: addOns, isLoading: isLoadingAddOns } = useAllGlobalAddOns();

	// Find the add-on we're editing
	const addOn = addOns?.find((a) => a.id === addOnId);

	// Upsert mutation
	const upsertMutation = useUpsertAddOn();

	// Form setup
	const form = useForm<AddOnFormValues>({
		resolver: zodResolver(addOnFormSchema),
		defaultValues: {
			name: "",
			description: null,
			defaultAmount: 0,
			applicableTo: "both",
			isActive: true,
		},
	});

	// Reset form when add-on changes
	useEffect(() => {
		if (addOn && isEditing) {
			form.reset({
				id: addOn.id,
				name: addOn.name,
				description: addOn.description,
				defaultAmount: addOn.defaultAmount,
				applicableTo: addOn.applicableTo,
				isActive: addOn.isActive,
			});
		} else if (!isEditing) {
			form.reset({
				name: "",
				description: null,
				defaultAmount: 0,
				applicableTo: "both",
				isActive: true,
			});
		}
	}, [addOn, isEditing, form]);

	// Handle submit
	const onSubmit = async (values: AddOnFormValues) => {
		try {
			const input: AddOnUpsertInput = {
				id: values.id,
				name: values.name,
				description: values.description,
				defaultAmount: values.defaultAmount,
				applicableTo: values.applicableTo,
				isActive: values.isActive,
			};

			await upsertMutation.mutateAsync(input);
			onOpenChange(false);
		} catch (error) {
			console.error("Failed to save add-on:", error);
		}
	};

	const isLoading = isEditing && isLoadingAddOns;

	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			<SheetContent className="w-full overflow-y-auto sm:max-w-xl">
				<SheetHeader>
					<SheetTitle>
						{isEditing ? "Edit Add-on" : "Create New Add-on"}
					</SheetTitle>
					<SheetDescription>
						{isEditing
							? "Update the add-on details and pricing."
							: "Create a new add-on that can be applied to services."}
					</SheetDescription>
				</SheetHeader>

				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="size-8 animate-spin text-muted-foreground" />
					</div>
				) : (
					<form
						className="space-y-6 px-6 py-4"
						onSubmit={form.handleSubmit(onSubmit)}
					>
						{/* General Information */}
						<div className="space-y-4">
							<h3 className="font-semibold text-sm">General Information</h3>

							<div className="space-y-2">
								<Label htmlFor="name">Name *</Label>
								<Input
									id="name"
									placeholder="e.g., Extended Lab Hours"
									{...form.register("name")}
								/>
								{form.formState.errors.name && (
									<p className="text-destructive text-xs">
										{form.formState.errors.name.message}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Description</Label>
								<Textarea
									id="description"
									placeholder="Add-on description..."
									rows={3}
									{...form.register("description")}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="defaultAmount">Default Amount (RM) *</Label>
									<Input
										id="defaultAmount"
										min="0"
										placeholder="0.00"
										step="0.01"
										type="number"
										{...form.register("defaultAmount", {
											valueAsNumber: true,
										})}
									/>
									{form.formState.errors.defaultAmount && (
										<p className="text-destructive text-xs">
											{form.formState.errors.defaultAmount.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="applicableTo">Applies To *</Label>
									<Select
										onValueChange={(value) =>
											form.setValue(
												"applicableTo",
												value as AddOnFormValues["applicableTo"],
											)
										}
										value={form.watch("applicableTo")}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select type" />
										</SelectTrigger>
										<SelectContent>
											{Object.entries(applicableToLabels).map(
												([value, label]) => (
													<SelectItem key={value} value={value}>
														{label}
													</SelectItem>
												),
											)}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<Switch
									checked={form.watch("isActive")}
									id="isActive"
									onCheckedChange={(checked) =>
										form.setValue("isActive", checked)
									}
								/>
								<Label htmlFor="isActive">Active</Label>
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
								{isEditing ? "Update Add-on" : "Create Add-on"}
							</Button>
						</SheetFooter>
					</form>
				)}
			</SheetContent>
		</Sheet>
	);
}
