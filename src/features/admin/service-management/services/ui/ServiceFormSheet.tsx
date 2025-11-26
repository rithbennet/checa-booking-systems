/**
 * Service Form Sheet
 *
 * Side sheet for creating/editing services
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useGlobalAddOns } from "@/entities/addon";
import { useAdminServiceDetail, useUpsertService } from "@/entities/service";
import { Button } from "@/shared/ui/shadcn/button";
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
	defaultPricing,
	type ServiceFormValues,
	serviceCategoryLabels,
	serviceFormSchema,
	userTypeLabels,
} from "../model/form-schema";

interface ServiceFormSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	serviceId?: string | null;
}

export function ServiceFormSheet({
	open,
	onOpenChange,
	serviceId,
}: ServiceFormSheetProps) {
	const isEditing = !!serviceId;

	// Fetch service detail if editing
	const { data: serviceDetail, isLoading: isLoadingDetail } =
		useAdminServiceDetail(serviceId ?? null);

	// Fetch global add-ons for the add-on section
	const { data: globalAddOns, isLoading: isLoadingAddOns } = useGlobalAddOns();

	// Upsert mutation
	const upsertMutation = useUpsertService();

	// Form setup
	const form = useForm<ServiceFormValues>({
		resolver: zodResolver(serviceFormSchema),
		defaultValues: {
			code: "",
			name: "",
			description: "",
			category: "ftir_atr",
			requiresSample: true,
			isActive: true,
			minSampleMass: null,
			operatingHours: "",
			pricing: defaultPricing,
			addOns: [],
		},
	});

	const { fields: pricingFields } = useFieldArray({
		control: form.control,
		name: "pricing",
	});

	// Reset form when service detail changes
	useEffect(() => {
		if (serviceDetail && isEditing) {
			form.reset({
				id: serviceDetail.id,
				code: serviceDetail.code,
				name: serviceDetail.name,
				description: serviceDetail.description ?? "",
				category: serviceDetail.category,
				requiresSample: serviceDetail.requiresSample,
				isActive: serviceDetail.isActive,
				minSampleMass: serviceDetail.minSampleMass,
				operatingHours: serviceDetail.operatingHours ?? "",
				pricing:
					serviceDetail.pricing.length > 0
						? serviceDetail.pricing
						: defaultPricing,
				addOns: serviceDetail.addOns.map((a) => ({
					addOnId: a.addOnId,
					isEnabled: a.isEnabled,
					customAmount: a.customAmount,
				})),
			});
		} else if (!isEditing) {
			form.reset({
				code: "",
				name: "",
				description: "",
				category: "ftir_atr",
				requiresSample: true,
				isActive: true,
				minSampleMass: null,
				operatingHours: "",
				pricing: defaultPricing,
				addOns: [],
			});
		}
	}, [serviceDetail, isEditing, form]);

	// Handle submit
	const onSubmit = async (values: ServiceFormValues) => {
		try {
			await upsertMutation.mutateAsync({
				...values,
				id: serviceId ?? undefined,
			});
			onOpenChange(false);
		} catch (error) {
			console.error("Failed to save service:", error);
		}
	};

	const isLoading = isLoadingDetail || isLoadingAddOns;

	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			<SheetContent className="w-full overflow-y-auto sm:max-w-xl">
				<SheetHeader>
					<SheetTitle>
						{isEditing ? "Edit Service" : "Create New Service"}
					</SheetTitle>
					<SheetDescription>
						{isEditing
							? "Update the service details, pricing, and add-ons."
							: "Fill in the service details, set pricing for different user types, and configure add-ons."}
					</SheetDescription>
				</SheetHeader>

				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="size-8 animate-spin text-muted-foreground" />
					</div>
				) : (
					<form
						className="space-y-6 py-4"
						onSubmit={form.handleSubmit(onSubmit)}
					>
						{/* General Information */}
						<div className="space-y-4">
							<h3 className="font-semibold text-sm">General Information</h3>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="code">Code *</Label>
									<Input
										id="code"
										placeholder="e.g., FTIR-001"
										{...form.register("code")}
									/>
									{form.formState.errors.code && (
										<p className="text-destructive text-xs">
											{form.formState.errors.code.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="category">Category *</Label>
									<Select
										onValueChange={(value) =>
											form.setValue(
												"category",
												value as ServiceFormValues["category"],
											)
										}
										value={form.watch("category")}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select category" />
										</SelectTrigger>
										<SelectContent>
											{Object.entries(serviceCategoryLabels).map(
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

							<div className="space-y-2">
								<Label htmlFor="name">Name *</Label>
								<Input
									id="name"
									placeholder="Service name"
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
									placeholder="Service description..."
									rows={3}
									{...form.register("description")}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="operatingHours">Operating Hours</Label>
									<Input
										id="operatingHours"
										placeholder="e.g., Mon-Fri 9am-5pm"
										{...form.register("operatingHours")}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="minSampleMass">Min Sample Mass (g)</Label>
									<Input
										id="minSampleMass"
										placeholder="0.000"
										step="0.001"
										type="number"
										{...form.register("minSampleMass", {
											setValueAs: (v) => (v === "" ? null : Number(v)),
										})}
									/>
								</div>
							</div>

							<div className="flex items-center gap-6">
								<div className="flex items-center gap-2">
									<Switch
										checked={form.watch("requiresSample")}
										id="requiresSample"
										onCheckedChange={(checked) =>
											form.setValue("requiresSample", checked)
										}
									/>
									<Label htmlFor="requiresSample">Requires Sample</Label>
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
						</div>

						{/* Pricing Matrix */}
						<div className="space-y-4">
							<h3 className="font-semibold text-sm">Pricing by User Type</h3>
							<div className="rounded-lg border">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b bg-muted/50">
											<th className="px-4 py-2 text-left font-medium">
												User Type
											</th>
											<th className="px-4 py-2 text-left font-medium">
												Price (RM)
											</th>
											<th className="px-4 py-2 text-left font-medium">Unit</th>
										</tr>
									</thead>
									<tbody>
										{pricingFields.map((field, index) => (
											<tr className="border-b last:border-0" key={field.id}>
												<td className="px-4 py-2">
													{userTypeLabels[field.userType] || field.userType}
												</td>
												<td className="px-4 py-2">
													<Input
														className="h-8 w-24"
														min="0"
														placeholder="0.00"
														step="0.01"
														type="number"
														{...form.register(`pricing.${index}.price`, {
															valueAsNumber: true,
														})}
													/>
												</td>
												<td className="px-4 py-2">
													<Input
														className="h-8 w-24"
														placeholder="sample"
														{...form.register(`pricing.${index}.unit`)}
													/>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>

						{/* Add-ons Section */}
						{globalAddOns && globalAddOns.length > 0 && (
							<div className="space-y-4">
								<h3 className="font-semibold text-sm">Available Add-ons</h3>
								<div className="space-y-3 rounded-lg border p-4">
									{globalAddOns.map((addOn) => {
										const existingAddOn = form
											.watch("addOns")
											?.find((a) => a.addOnId === addOn.id);
										const isEnabled = existingAddOn?.isEnabled ?? false;

										return (
											<div
												className="flex items-start gap-3 rounded-md border p-3"
												key={addOn.id}
											>
												<Checkbox
													checked={isEnabled}
													id={`addon-${addOn.id}`}
													onCheckedChange={(checked) => {
														const currentAddOns = form.watch("addOns") || [];
														if (checked) {
															form.setValue("addOns", [
																...currentAddOns.filter(
																	(a) => a.addOnId !== addOn.id,
																),
																{
																	addOnId: addOn.id,
																	isEnabled: true,
																	customAmount: null,
																},
															]);
														} else {
															form.setValue(
																"addOns",
																currentAddOns.filter(
																	(a) => a.addOnId !== addOn.id,
																),
															);
														}
													}}
												/>
												<div className="flex-1">
													<Label
														className="font-medium"
														htmlFor={`addon-${addOn.id}`}
													>
														{addOn.name}
													</Label>
													{addOn.description && (
														<p className="text-muted-foreground text-xs">
															{addOn.description}
														</p>
													)}
													<p className="text-muted-foreground text-xs">
														Default: RM {addOn.defaultAmount.toFixed(2)} •{" "}
														Applies to: {addOn.applicableTo}
													</p>
												</div>
												{isEnabled && (
													<div className="flex items-center gap-2">
														<Label className="whitespace-nowrap text-xs">
															Custom RM:
														</Label>
														<Input
															className="h-8 w-20"
															onChange={(e) => {
																const value = e.target.value;
																const currentAddOns =
																	form.watch("addOns") || [];
																form.setValue(
																	"addOns",
																	currentAddOns.map((a) =>
																		a.addOnId === addOn.id
																			? {
																					...a,
																					customAmount:
																						value === "" ? null : Number(value),
																				}
																			: a,
																	),
																);
															}}
															placeholder="Default"
															step="0.01"
															type="number"
															value={existingAddOn?.customAmount ?? ""}
														/>
													</div>
												)}
											</div>
										);
									})}
								</div>
							</div>
						)}

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
								{isEditing ? "Update Service" : "Create Service"}
							</Button>
						</SheetFooter>
					</form>
				)}
			</SheetContent>
		</Sheet>
	);
}
