"use client";

import { Trash2 } from "lucide-react";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import type { SelectedService } from "../model/types";

interface SelectedServiceCardProps {
	service: SelectedService;
	onRemove: (serviceId: string) => void;
}

export function SelectedServiceCard({
	service,
	onRemove,
}: SelectedServiceCardProps) {
	const totalPrice = service.selectedPricing
		? service.selectedPricing.price *
		(service.quantity || 1)
		: 0;

	return (
		<Card className="border-l-4 border-l-blue-500 shadow-sm">
			<CardHeader className="pb-4">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<CardTitle className="font-semibold text-gray-900 text-lg">
							{service.name}
						</CardTitle>
						<CardDescription className="mt-1 text-gray-600 text-sm">
							{service.code}
							{service.selectedPricing && (
								<>
									{" • "}
									<span className="font-medium text-blue-600">
										RM {service.selectedPricing.price}
									</span>{" "}
									{service.selectedPricing.unit}
								</>
							)}
						</CardDescription>
						{service.description && (
							<p className="mt-2 text-gray-500 text-sm">
								{service.description}
							</p>
						)}
						{service.quantity && (
							<div className="mt-2">
								<Badge variant="outline">Quantity: {service.quantity}</Badge>
							</div>
						)}
						{totalPrice > 0 && (
							<div className="mt-2">
								<Badge className="bg-green-600">
									Total: RM {totalPrice.toFixed(2)}
								</Badge>
							</div>
						)}
					</div>
					<Button
						className="text-red-600 hover:bg-red-50 hover:text-red-800"
						onClick={() => onRemove(service.id)}
						size="sm"
						variant="ghost"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</CardHeader>
		</Card>
	);
}
