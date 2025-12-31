"use client";

import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type {
	BookingServiceItemInput,
	CreateBookingInput,
} from "@/entities/booking/model/schemas";
import type { Service } from "@/entities/service";
import { getServicePrice } from "@/entities/service";
import {
	campusLabel,
	formatInvoicePayerType,
	generateTempReference,
} from "@/shared/lib/billing";
import { Badge } from "@/shared/ui/shadcn/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import { Checkbox } from "@/shared/ui/shadcn/checkbox";
import { Label } from "@/shared/ui/shadcn/label";
import { Separator } from "@/shared/ui/shadcn/separator";

interface ReviewStepProps {
	form: UseFormReturn<CreateBookingInput>;
	fields: Array<BookingServiceItemInput & { id: string }>;
	getServiceForField: (serviceId: string) => Service | undefined;
	userType: "mjiit_member" | "utm_member" | "external_member";
	services: Service[];
}

export function ReviewStep({
	form,
	fields,
	getServiceForField,
	userType,
	services,
}: ReviewStepProps) {
	const [confirmed, setConfirmed] = useState(false);
	const tempRef = generateTempReference();

	const [
		projectDescription,
		additionalNotes,
		payerType,
		billingName,
		billingAddressDisplay,
		billingPhone,
		billingEmail,
		utmCampus,
	] = form.watch([
		"projectDescription",
		"additionalNotes",
		"payerType",
		"billingName",
		"billingAddressDisplay",
		"billingPhone",
		"billingEmail",
		"utmCampus",
		"workspaceBookings",
	]);

	// Group services
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

	// Build add-on lookup per service for pricing display (effective amounts)
	const addOnPriceMapByService = new Map<string, Map<string, number>>();
	services.forEach((svc) => {
		const map = new Map<string, number>();
		(svc.addOns || []).forEach((a) => {
			const amount = (a as { effectiveAmount: number }).effectiveAmount;
			map.set((a as { id: string }).id, amount);
		});
		addOnPriceMapByService.set(svc.id, map);
	});

	// Calculate totals
	let totalAmount = 0;
	Object.entries(grouped).forEach(([serviceId, items]) => {
		const service = getServiceForField(serviceId);
		if (service) {
			const pricing = getServicePrice(service, userType);
			if (pricing) {
				items.forEach((item) => {
					const qty = item.item.quantity || 1;
					// For analysis/testing services, months should not apply
					const base = pricing.price * qty;
					// Add-ons (added once per item, aligned with server compute)
					const addOnMap = addOnPriceMapByService.get(service.id);
					const addOnsSum = (item.item.addOnCatalogIds || []).reduce(
						(acc, id) => {
							const amt = addOnMap?.get(id) ?? 0;
							return acc + amt;
						},
						0,
					);
					totalAmount += base + addOnsSum;
				});
			}
		}
	});

	// Add workspace bookings totals (based on monthly rate)
	const workingSpaceService = services.find(
		(s) => s.category === "working_space",
	);
	const wsPricing = workingSpaceService
		? getServicePrice(workingSpaceService, userType)
		: null;
	const wsBookings = (form.getValues("workspaceBookings") || []) as NonNullable<
		CreateBookingInput["workspaceBookings"]
	>;
	if (wsPricing) {
		const wsAddOnMap = workingSpaceService
			? addOnPriceMapByService.get(workingSpaceService.id)
			: undefined;
		wsBookings.forEach(
			(ws: NonNullable<CreateBookingInput["workspaceBookings"]>[number]) => {
				if (ws.startDate && ws.endDate) {
					const start = new Date(ws.startDate);
					const end = new Date(ws.endDate);
					const days = Math.max(
						0,
						Math.ceil(
							(end.getTime() - start.getTime() + 24 * 60 * 60 * 1000) /
							(24 * 60 * 60 * 1000),
						),
					);
					const months = Math.max(1, Math.ceil(days / 30));
					const base = wsPricing.price * months;
					const addOnsSum = (ws.addOnCatalogIds || []).reduce(
						(acc: number, id: string) => acc + (wsAddOnMap?.get(id) ?? 0),
						0,
					);
					totalAmount += base + addOnsSum;
				}
			},
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-xl">Review & Submit</CardTitle>
				<CardDescription>
					Please review all information before submitting your booking request
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Preview Reference */}
				<div className="rounded-lg bg-blue-50 p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium text-blue-900 text-sm">
								Temporary Reference (Preview)
							</p>
							<p className="font-mono text-blue-700 text-lg">{tempRef}</p>
						</div>
						<Badge className="bg-blue-100 text-blue-800">Preview</Badge>
					</div>
					<p className="mt-2 text-blue-700 text-xs">
						This is a preview reference. You'll receive an official reference
						number upon successful submission.
					</p>
				</div>

				{/* Services Summary */}
				<div>
					<h3 className="mb-3 font-semibold text-gray-900">
						Services ({Object.keys(grouped).length})
					</h3>
					<div className="space-y-3">
						{Object.entries(grouped).map(([serviceId, items]) => {
							const service = getServiceForField(serviceId);
							if (!service) return null;

							const pricing = getServicePrice(service, userType);
							const isWorkingSpace = service.category === "working_space";

							return (
								<div className="rounded-lg border bg-white p-4" key={serviceId}>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<p className="font-medium text-gray-900">
												{service.name}
											</p>
											<p className="text-gray-500 text-sm">{service.code}</p>
										</div>
										<Badge variant="secondary">
											{items.length}{" "}
											{isWorkingSpace
												? items.length === 1
													? "slot"
													: "slots"
												: items.length === 1
													? "sample"
													: "samples"}
										</Badge>
									</div>
									{pricing && (
										<p className="mt-2 text-gray-600 text-sm">
											RM {pricing.price.toFixed(2)} {pricing.unit}
										</p>
									)}

									{/* Per-item breakdown for analysis/testing services */}
									{!isWorkingSpace && pricing && (
										<div className="mt-3 divide-y rounded-md border">
											{items.map(({ item }, idx) => {
												const qty = item.quantity || 1;
												const baseLine = qty * pricing.price;
												const addOnMap = addOnPriceMapByService.get(service.id);
												const selectedAddOnIds = item.addOnCatalogIds || [];
												const addOnsSum = selectedAddOnIds.reduce(
													(acc: number, id: string) =>
														acc + (addOnMap?.get(id) ?? 0),
													0,
												);
												const addOnNames = selectedAddOnIds
													.map(
														(id) =>
															(service.addOns || []).find((a) => a.id === id)
																?.name,
													)
													.filter(Boolean) as string[];
												const lineTotal = baseLine + addOnsSum;
												return (
													<div
														className="flex items-center justify-between px-3 py-2 text-sm"
														key={`${serviceId}-${item.sampleName ?? "sample"}-${idx}`}
													>
														<div className="min-w-0">
															<p className="truncate font-medium text-gray-900">
																{item.sampleName?.trim() || `Sample ${idx + 1}`}
															</p>
															{item.notes && (
																<p className="truncate text-gray-500 text-xs">
																	{item.notes}
																</p>
															)}
															{addOnsSum > 0 && (
																<p className="truncate text-gray-600 text-xs">
																	Add-ons: {addOnNames.join(", ")} • RM{" "}
																	{addOnsSum.toFixed(2)}
																</p>
															)}
														</div>
														<div className="ml-3 shrink-0 text-right text-gray-700">
															<div>Qty: {qty}</div>
															<div className="font-semibold">
																RM {lineTotal.toFixed(2)}
															</div>
														</div>
													</div>
												);
											})}
											{(() => {
												const baseSubtotal = items.reduce(
													(acc, { item }) =>
														acc + (item.quantity || 1) * pricing.price,
													0,
												);
												const addOnsSubtotal = items.reduce((acc, { item }) => {
													const addOnMap = addOnPriceMapByService.get(
														service.id,
													);
													return (
														acc +
														(item.addOnCatalogIds || []).reduce(
															(a: number, id: string) =>
																a + (addOnMap?.get(id) ?? 0),
															0,
														)
													);
												}, 0);
												const subtotal = baseSubtotal + addOnsSubtotal;
												return (
													<div className="bg-gray-50 px-3 py-2 text-sm">
														<div className="flex items-center justify-between">
															<span className="font-medium text-gray-900">
																Subtotal
															</span>
															<span className="font-semibold text-gray-900">
																RM {subtotal.toFixed(2)}
															</span>
														</div>
														{addOnsSubtotal > 0 && (
															<div className="mt-1 flex items-center justify-between text-gray-600 text-xs">
																<span>Includes add-ons</span>
																<span>RM {addOnsSubtotal.toFixed(2)}</span>
															</div>
														)}
													</div>
												);
											})()}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>

				{/* Workspace bookings summary */}
				<div>
					<h3 className="mb-3 font-semibold text-gray-900">
						Workspace bookings ({wsBookings.length})
					</h3>
					{wsBookings.length === 0 ? (
						<p className="text-gray-500 text-sm">No workspace bookings.</p>
					) : (
						<div className="space-y-3">
							{wsBookings.map(
								(
									ws: NonNullable<
										CreateBookingInput["workspaceBookings"]
									>[number],
									idx: number,
								) => {
									const start = ws.startDate ? new Date(ws.startDate) : null;
									const end = ws.endDate ? new Date(ws.endDate) : null;
									let months: number | null = null;
									if (start && end) {
										const days = Math.max(
											0,
											Math.ceil(
												(end.getTime() -
													start.getTime() +
													24 * 60 * 60 * 1000) /
												(24 * 60 * 60 * 1000),
											),
										);
										months = Math.max(1, Math.ceil(days / 30));
									}
									return (
										<div
											className="rounded-lg border bg-white p-4"
											key={`${start?.toISOString() ?? ""}-${end?.toISOString() ?? ""}-${idx}`}
										>
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium text-gray-900">
														{start ? start.toDateString() : "-"} —{" "}
														{end ? end.toDateString() : "-"}
													</p>
													{ws.preferredTimeSlot && (
														<p className="text-gray-500 text-sm">
															Preferred: {ws.preferredTimeSlot}
														</p>
													)}
												</div>
												{wsPricing && months !== null && (
													<div className="text-right">
														<Badge variant="secondary">
															{months} {months === 1 ? "month" : "months"} × RM{" "}
															{wsPricing.price.toFixed(2)}
														</Badge>
														{(() => {
															const wsAddOnMap = workingSpaceService
																? addOnPriceMapByService.get(
																	workingSpaceService.id,
																)
																: undefined;
															const addOnsSum = (
																ws.addOnCatalogIds || []
															).reduce(
																(acc: number, id: string) =>
																	acc + (wsAddOnMap?.get(id) ?? 0),
																0,
															);
															const total =
																months * wsPricing.price + addOnsSum;
															return (
																<div className="mt-1 text-right text-sm">
																	{addOnsSum > 0 && (
																		<div className="text-gray-600">
																			Add-ons: RM {addOnsSum.toFixed(2)}
																		</div>
																	)}
																	<div className="font-semibold text-gray-900">
																		RM {total.toFixed(2)}
																	</div>
																</div>
															);
														})()}
													</div>
												)}
											</div>
										</div>
									);
								},
							)}
						</div>
					)}
				</div>

				<Separator />

				{/* Project Info */}
				{projectDescription && (
					<div>
						<h3 className="mb-2 font-semibold text-gray-900">
							Project Description
						</h3>
						<p className="text-gray-700 text-sm">{projectDescription}</p>
					</div>
				)}

				{additionalNotes && (
					<div>
						<h3 className="mb-2 font-semibold text-gray-900">
							Additional Notes
						</h3>
						<p className="text-gray-700 text-sm">{additionalNotes}</p>
					</div>
				)}

				<Separator />

				{/* Billing Info */}
				<div>
					<h3 className="mb-3 font-semibold text-gray-900">
						Billing Information
					</h3>
					<div className="space-y-2 rounded-lg bg-gray-50 p-4">
						<div className="flex justify-between text-sm">
							<span className="text-gray-600">Payer Type:</span>
							<span className="font-medium text-gray-900">
								{formatInvoicePayerType(payerType)}
							</span>
						</div>
						{billingName && (
							<div className="flex justify-between text-sm">
								<span className="text-gray-600">Billing Name:</span>
								<span className="font-medium text-gray-900">{billingName}</span>
							</div>
						)}
						{billingAddressDisplay && (
							<div className="flex justify-between text-sm">
								<span className="text-gray-600">Billing Address:</span>
								<span className="text-right font-medium text-gray-900">
									{billingAddressDisplay}
								</span>
							</div>
						)}
						{utmCampus && (
							<div className="flex justify-between text-sm">
								<span className="text-gray-600">Campus:</span>
								<span className="font-medium text-gray-900">
									{campusLabel(utmCampus)}
								</span>
							</div>
						)}
						<div className="flex justify-between text-sm">
							<span className="text-gray-600">Phone:</span>
							<span className="font-medium text-gray-900">
								{billingPhone || "Not provided"}
							</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-gray-600">Email:</span>
							<span className="font-medium text-gray-900">
								{billingEmail || "Not provided"}
							</span>
						</div>
					</div>
				</div>

				<Separator />

				{/* Estimated Total */}
				<div className="rounded-lg bg-green-50 p-4">
					<div className="flex items-center justify-between">
						<span className="font-semibold text-green-900">
							Estimated Total
						</span>
						<span className="font-bold text-green-900 text-xl">
							RM {totalAmount.toFixed(2)}
						</span>
					</div>
					<p className="mt-1 text-green-700 text-xs">
						This is an estimate. Final amount may vary based on actual usage and
						requirements.
					</p>
				</div>

				{/* Confirmation Checkbox */}
				<div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-4">
					<div className="flex items-start space-x-3">
						<Checkbox
							checked={confirmed}
							id="confirm-booking"
							onCheckedChange={(checked) => setConfirmed(checked as boolean)}
						/>
						<div className="flex-1">
							<Label
								className="cursor-pointer font-medium text-sm leading-relaxed"
								htmlFor="confirm-booking"
							>
								I confirm that all information provided is accurate and I
								understand that this booking request will be reviewed by CHECA
								staff before approval.
							</Label>
						</div>
					</div>
					{!confirmed && (
						<p className="mt-2 ml-7 text-red-600 text-xs">
							Please confirm before submitting your booking request.
						</p>
					)}
				</div>

				{/* Track confirmation state in parent form */}
			</CardContent>
		</Card>
	);
}
