"use client";

import {
	Calendar,
	FlaskConical,
	Info,
	Microscope,
	Package,
	Sparkles,
	Zap,
} from "lucide-react";
import type { Service, ServicePricing, UserType } from "@/entities/service";
import {
	formatServiceCategory,
	getServicePricingTiers,
} from "@/entities/service";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import { Separator } from "@/shared/ui/shadcn/separator";

const iconMap: Record<string, typeof FlaskConical> = {
	ftir_atr: FlaskConical,
	ftir_kbr: FlaskConical,
	uv_vis_absorbance: Zap,
	uv_vis_reflectance: Zap,
	bet_analysis: Microscope,
	hplc_pda: FlaskConical,
	working_space: Calendar,
};

interface ServiceDetailsDialogProps {
	service: Service | null;
	userType: UserType;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const getUserTypeLabel = (type: UserType): string => {
	switch (type) {
		case "mjiit_member":
			return "MJIIT Member";
		case "utm_member":
			return "UTM Member";
		case "external_member":
			return "External Client";
		default:
			return "Member";
	}
};

export function ServiceDetailsDialog({
	service,
	userType,
	open,
	onOpenChange,
}: ServiceDetailsDialogProps) {
	if (!service) return null;

	const addOns = service.addOns || [];

	const IconComponent = iconMap[service.category] || FlaskConical;
	const pricingTiers = getServicePricingTiers(service);
	const pricingEntries = Object.entries(pricingTiers).filter(
		([, pricing]) => pricing !== null,
	) as Array<[UserType, ServicePricing]>;

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<div className="flex items-start gap-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
							<IconComponent className="h-6 w-6 text-blue-600" />
						</div>
						<div className="flex-1">
							<DialogTitle className="text-xl">{service.name}</DialogTitle>
							<DialogDescription className="mt-1">
								Service Code: {service.code}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-6">
					{/* Description */}
					{service.description && (
						<div>
							<h3 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
								<Info className="h-4 w-4" />
								Description
							</h3>
							<p className="text-gray-600 text-sm leading-relaxed">
								{service.description}
							</p>
						</div>
					)}

					<Separator />

					{/* Service Information */}
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<h3 className="mb-2 font-semibold text-gray-900 text-sm">
								Category
							</h3>
							<Badge className="text-sm" variant="outline">
								{formatServiceCategory(service.category)}
							</Badge>
						</div>

						{service.operatingHours && (
							<div>
								<h3 className="mb-2 font-semibold text-gray-900 text-sm">
									Operating Hours
								</h3>
								<p className="text-gray-600 text-sm">
									{service.operatingHours}
								</p>
							</div>
						)}
					</div>

					<Separator />

					{/* Sample Requirements */}
					<div>
						<h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
							<Package className="h-4 w-4" />
							Sample Requirements
						</h3>
						<div className="space-y-2">
							<div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
								<span className="text-gray-700 text-sm">Sample Required:</span>
								<Badge variant={service.requiresSample ? "default" : "outline"}>
									{service.requiresSample ? "Yes" : "No"}
								</Badge>
							</div>
							{service.requiresSample && service.minSampleMass && (
								<div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
									<span className="text-gray-700 text-sm">
										Minimum Sample Mass:
									</span>
									<span className="font-medium text-gray-900">
										{service.minSampleMass} g
									</span>
								</div>
							)}
						</div>
					</div>

					<Separator />

					{/* Pricing Information */}
					<div>
						<h3 className="mb-3 font-semibold text-gray-900">Pricing</h3>
						{pricingEntries.length > 0 ? (
							<div className="space-y-3">
								{pricingEntries.map(([userTypeKey, pricing]) => (
									<div
										className={`rounded-lg border-2 p-4 ${userTypeKey === userType
												? "border-blue-500 bg-blue-50"
												: "border-gray-200 bg-gray-50"
											}`}
										key={userTypeKey}
									>
										<div className="flex items-center justify-between">
											<div>
												<span
													className={`font-medium text-sm ${userTypeKey === userType
															? "text-blue-800"
															: "text-gray-700"
														}`}
												>
													{getUserTypeLabel(userTypeKey)}
													{userTypeKey === userType && (
														<Badge className="ml-2 bg-blue-600">
															Your Rate
														</Badge>
													)}
												</span>
											</div>
											<div className="text-right">
												<span
													className={`font-bold text-lg ${userTypeKey === userType
															? "text-blue-900"
															: "text-gray-900"
														}`}
												>
													RM {Number(pricing.price)}
												</span>
												<span
													className={`block text-sm ${userTypeKey === userType
															? "text-blue-700"
															: "text-gray-600"
														}`}
												>
													per {pricing.unit}
												</span>
											</div>
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="text-gray-500 text-sm">
								Pricing information not available.
							</p>
						)}
					</div>

					{/* Available Add-Ons */}
					{addOns.length > 0 && (
						<>
							<Separator />
							<div>
								<h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
									<Sparkles className="h-4 w-4" />
									Available Add-Ons
								</h3>
								<div className="space-y-2">
									{addOns.map((addon) => (
										<div
											className="flex items-start justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
											key={addon.id}
										>
											<div className="flex-1">
												<div className="flex items-center gap-2">
													<span className="font-medium text-gray-900 text-sm">
														{addon.name}
													</span>
													{addon.applicableTo === "sample" && (
														<Badge className="bg-blue-100 text-blue-700 text-xs">
															Sample
														</Badge>
													)}
													{addon.applicableTo === "workspace" && (
														<Badge className="bg-green-100 text-green-700 text-xs">
															Workspace
														</Badge>
													)}
													{addon.applicableTo === "both" && (
														<Badge className="bg-purple-100 text-purple-700 text-xs">
															Both
														</Badge>
													)}
												</div>
												{addon.description && (
													<p className="mt-1 text-gray-600 text-xs">
														{addon.description}
													</p>
												)}
											</div>
											<div className="text-right">
												<span className="font-semibold text-gray-900">
													RM {addon.effectiveAmount.toFixed(2)}
												</span>
												{addon.customAmount && (
													<p className="text-gray-500 text-xs line-through">
														RM {addon.defaultAmount.toFixed(2)}
													</p>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						</>
					)}
				</div>

				{/* Footer Actions */}
				<div className="flex items-center justify-end gap-3 pt-4">
					<Button onClick={() => onOpenChange(false)} variant="outline">
						Close
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
