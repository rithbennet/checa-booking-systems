"use client";

import { Filter, FlaskConical } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import { Card, CardContent } from "@/shared/ui/shadcn/card";
import { ServiceCard, ServiceFilters } from "@/features/browse-services";
import type {
	Service,
	ServiceFilters as ServiceFiltersType,
	UserType,
} from "@/entities/service";
import { useServices } from "@/entities/service";
import { useRouter } from "next/navigation";

interface ServicesPageProps {
	userType?: UserType;
	initialServices?: Service[];
}

export function ServicesPage({
	userType = "mjiit_member",
	initialServices = [],
}: ServicesPageProps) {
	const router = useRouter();
	const [filters, setFilters] = useState<ServiceFiltersType>({
		category: "all",
		availability: "all",
		priceRange: [0, 1000],
		userType,
	});

	const { data: services = initialServices, isLoading: loading } = useServices(
		filters,
	);

	const handleViewDetails = (serviceId: string) => {
		// Navigate to service details page or open modal
		console.log("View details for service:", serviceId);
	};

	const handleAddToBooking = (serviceId: string) => {
		// Navigate to booking page with service preselected
		router.push(`/booking?serviceId=${serviceId}`);
	};

	const filteredServices = services.filter((service) => {
		const matchesSearch =
			!filters.search ||
			service.name.toLowerCase().includes(filters.search.toLowerCase()) ||
			service.description?.toLowerCase().includes(filters.search.toLowerCase());
		const matchesCategory =
			!filters.category || filters.category === "all" || service.category === filters.category;
		const matchesAvailability = !filters.availability || filters.availability === "all";
		return matchesSearch && matchesCategory && matchesAvailability;
	});

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

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
					{/* Filters Sidebar */}
					<div className="lg:col-span-1">
						<ServiceFilters filters={filters} onFiltersChange={setFilters} />

						{/* User Rate Info */}
						<Card className="mt-6 border-blue-200 bg-blue-50">
							<div className="p-4">
								<h3 className="font-semibold text-blue-800 text-lg">
									Your Pricing
								</h3>
								<div className="mt-2 flex items-center space-x-2">
									<Badge className="bg-blue-600">{getUserTypeLabel(userType)}</Badge>
								</div>
								<p className="mt-2 text-blue-700 text-sm">
									You receive special {getUserTypeLabel(userType)} pricing on all
									services.
								</p>
							</div>
						</Card>
					</div>

					{/* Services Grid */}
					<div className="lg:col-span-3">
						<div className="mb-6 flex items-center justify-between">
							<div>
								<h2 className="font-bold text-2xl text-gray-900">
									Available Lab Services
								</h2>
								<p className="text-gray-600">
									{filteredServices.length} services available
								</p>
							</div>
							<div className="flex items-center space-x-2">
								<Button variant="outline">
									<Filter className="mr-2 h-4 w-4" />
									Sort by Price
								</Button>
							</div>
						</div>

						{loading ? (
							<Card className="py-12 text-center">
								<CardContent>
									<p className="text-gray-600">Loading services...</p>
								</CardContent>
							</Card>
						) : filteredServices.length === 0 ? (
							<Card className="py-12 text-center">
								<CardContent>
									<FlaskConical className="mx-auto mb-4 h-12 w-12 text-gray-400" />
									<h3 className="mb-2 font-medium text-gray-900 text-lg">
										No Services Available
									</h3>
									<p className="text-gray-600">
										No services match your current filter criteria.
									</p>
									<Button
										className="mt-4"
										onClick={() => {
											setFilters({
												category: "all",
												availability: "all",
												priceRange: [0, 1000],
												userType,
											});
										}}
									>
										Clear Filters
									</Button>
								</CardContent>
							</Card>
						) : (
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
								{filteredServices.map((service) => (
									<ServiceCard
										key={service.id}
										service={service}
										userType={userType}
										onViewDetails={handleViewDetails}
										onAddToBooking={handleAddToBooking}
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

