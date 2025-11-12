"use client";

import {
	Calendar,
	Eye,
	FlaskConical,
	Microscope,
	Plus,
	Zap,
} from "lucide-react";
import { useState } from "react";
import type { UserType } from "@/entities/service";
import { formatServiceCategory, getServicePrice } from "@/entities/service";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import type { ServiceCardProps } from "../model/types";
import { ServiceDetailsDialog } from "./ServiceDetailsDialog";

const iconMap: Record<string, typeof FlaskConical> = {
	ftir_atr: FlaskConical,
	ftir_kbr: FlaskConical,
	uv_vis_absorbance: Zap,
	uv_vis_reflectance: Zap,
	bet_analysis: Microscope,
	hplc_pda: FlaskConical,
	working_space: Calendar,
};

export function ServiceCard({
	service,
	userType,
	onViewDetails,
	onAddToBooking,
}: ServiceCardProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const IconComponent = iconMap[service.category] || FlaskConical;
	const pricing = getServicePrice(service, userType);
	const isUnavailable = !service.isActive;

	const getUserTypeLabel = (type: UserType): string => {
		switch (type) {
			case "mjiit_member":
				return "MJIIT Member Rate";
			case "utm_member":
				return "UTM Member Rate";
			case "external_member":
				return "External Client Rate";
			default:
				return "Rate";
		}
	};

	const handleViewDetails = () => {
		setIsDialogOpen(true);
		onViewDetails(service.id);
	};

	return (
		<>
			<Card
				className={cn(
					"transition-shadow hover:shadow-lg",
					isUnavailable && "border-dashed opacity-80"
				)}
			>
				<CardHeader>
					<div className="flex items-start justify-between">
						<div className="flex items-center space-x-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
								<IconComponent className="h-5 w-5 text-blue-600" />
							</div>
							<div>
								<CardTitle className="text-lg">{service.name}</CardTitle>
								<CardDescription className="text-gray-500 text-sm">
									Code: {service.code}
								</CardDescription>
							</div>
						</div>
						<Badge
							className={cn(
								"text-white",
								service.isActive ? "bg-green-500" : "bg-red-500"
							)}
						>
							{service.isActive ? "Available" : "Unavailable"}
						</Badge>
					</div>
				</CardHeader>
				<CardContent>
					{service.description && (
						<p className="mb-4 text-gray-600 text-sm">{service.description}</p>
					)}

					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-gray-600 text-sm">Category:</span>
							<Badge variant="outline">
								{formatServiceCategory(service.category)}
							</Badge>
						</div>

						{pricing && (
							<div className="rounded-lg bg-blue-50 p-3">
								<div className="flex items-center justify-between">
									<span className="font-medium text-blue-800 text-sm">
										{getUserTypeLabel(userType)}:
									</span>
									<div className="text-right">
										<span className="font-bold text-blue-900 text-lg">
											RM {pricing.price}
										</span>
										<span className="block text-blue-700 text-sm">
											{pricing.unit}
										</span>
									</div>
								</div>
							</div>
						)}
					</div>

					{isUnavailable && (
						<p className="mt-2 font-medium text-amber-700 text-sm">
							Currently unavailable for booking.
						</p>
					)}

					<div className="mt-4 flex items-center space-x-2">
						<Button
							className="flex-1"
							onClick={handleViewDetails}
							variant="outline"
						>
							<Eye className="mr-2 h-4 w-4" />
							View Details
						</Button>
						<Button
							className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400 disabled:hover:bg-blue-400"
							disabled={isUnavailable}
							onClick={() => onAddToBooking(service.id)}
						>
							<Plus className="mr-2 h-4 w-4" />
							Add to Booking
						</Button>
					</div>
				</CardContent>
			</Card>

			<ServiceDetailsDialog
				onAddToBooking={onAddToBooking}
				onOpenChange={setIsDialogOpen}
				open={isDialogOpen}
				service={service}
				userType={userType}
			/>
		</>
	);
}
