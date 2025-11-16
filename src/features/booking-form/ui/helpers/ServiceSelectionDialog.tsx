"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import type { Service, UserType } from "@/entities/service";
import { formatServiceCategory, getServicePrice } from "@/entities/service";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import { Input } from "@/shared/ui/shadcn/input";
import { Skeleton } from "@/shared/ui/shadcn/skeleton";

interface ServiceSelectionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	userType: UserType;
	selectedServiceIds: string[];
	onSelectService: (service: Service) => void;
	services: Service[];
}

export function ServiceSelectionDialog({
	open,
	onOpenChange,
	userType,
	selectedServiceIds,
	onSelectService,
	services,
}: ServiceSelectionDialogProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const isLoading = false;

	// Filter services: exclude already selected, filter by search, only active
	// No memoization needed - small dataset (<10 services), simple filtering
	const availableServices = services.filter(
		(service) =>
			service.isActive &&
			service.category !== "working_space" &&
			!selectedServiceIds.includes(service.id) &&
			(searchQuery === "" ||
				service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				service.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
				service.description?.toLowerCase().includes(searchQuery.toLowerCase())),
	);

	const handleSelect = (service: Service) => {
		onSelectService(service);
		setSearchQuery("");
		onOpenChange(false);
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-h-[90vh] max-w-3xl">
				<DialogHeader>
					<DialogTitle>Select a Service</DialogTitle>
					<DialogDescription>
						Choose a service to add to your booking request
					</DialogDescription>
				</DialogHeader>

				{/* Search */}
				<div className="relative">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-gray-400" />
					<Input
						className="pl-10"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search services by name, code, or description..."
						value={searchQuery}
					/>
				</div>

				{/* Services List */}
				<div className="max-h-[60vh] overflow-y-auto">
					{isLoading ? (
						<div className="space-y-4">
							{Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map(
								(key) => (
									<div className="flex items-center gap-4" key={key}>
										<Skeleton className="h-16 w-16 rounded-lg" />
										<div className="flex-1 space-y-2">
											<Skeleton className="h-4 w-3/4" />
											<Skeleton className="h-3 w-1/2" />
										</div>
										<Skeleton className="h-9 w-24" />
									</div>
								),
							)}
						</div>
					) : availableServices.length === 0 ? (
						<div className="py-12 text-center">
							<p className="text-gray-500">
								{searchQuery
									? "No services found matching your search."
									: "All available services have been added to your booking."}
							</p>
						</div>
					) : (
						<div className="space-y-2">
							{availableServices.map((service) => {
								const pricing = getServicePrice(service, userType);
								return (
									<div
										className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
										key={service.id}
									>
										<div className="flex-1">
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<h4 className="font-semibold text-gray-900">
														{service.name}
													</h4>
													<p className="text-gray-500 text-sm">
														{service.code} •{" "}
														{formatServiceCategory(service.category)}
													</p>
													{service.description && (
														<p className="mt-1 line-clamp-2 text-gray-600 text-sm">
															{service.description}
														</p>
													)}
												</div>
											</div>
											{pricing && (
												<div className="mt-2">
													<Badge className="bg-blue-100 text-blue-800">
														RM {pricing.price} per {pricing.unit}
													</Badge>
												</div>
											)}
										</div>
										<Button
											className="ml-4"
											onClick={() => handleSelect(service)}
										>
											Add
										</Button>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
