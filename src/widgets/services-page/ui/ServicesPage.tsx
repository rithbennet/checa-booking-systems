"use client";

import { Filter, FlaskConical, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type {
	Service,
	ServiceFilters as ServiceFiltersType,
	UserType,
} from "@/entities/service";
import {
	ServiceCard,
	ServiceFiltersComponent,
} from "@/features/browse-services";
import RouterButton from "@/shared/ui/router-button";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import { Card, CardContent, CardHeader } from "@/shared/ui/shadcn/card";
import { Skeleton } from "@/shared/ui/shadcn/skeleton";

interface ServicesPageProps {
	userType?: UserType;
	initialServices?: Service[];
}

export function ServicesPage({
	userType = "mjiit_member",
	initialServices = [],
}: ServicesPageProps) {

	const [filters, setFilters] = useState<ServiceFiltersType>({
		category: "all",
		availability: "all",
		priceRange: [0, 1000],
		userType,
	});
	const [sortBy, setSortBy] = useState<"name" | "price" | null>(null);
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

	// Services are fetched server-side and passed as props
	// All filtering, sorting, and searching happens client-side for instant performance
	const allServices = initialServices;
	const loading = false;

	const handleViewDetails = (serviceId: string) => {
		// Navigate to service details page or open modal
		console.log("View details for service:", serviceId);
	};

	// Simplified flow: no per-card add; provide a single create booking CTA

	// Client-side filtering, sorting, and searching - instant performance
	// Since we have <10 services, this is much faster than API calls
	const filteredAndSortedServices = useMemo(() => {
		let result = [...allServices];

		// Filter by search
		if (filters.search) {
			const searchLower = filters.search.toLowerCase();
			result = result.filter(
				(service) =>
					service.name.toLowerCase().includes(searchLower) ||
					service.description?.toLowerCase().includes(searchLower) ||
					service.code.toLowerCase().includes(searchLower),
			);
		}

		// Filter by category
		if (filters.category && filters.category !== "all") {
			result = result.filter(
				(service) => service.category === filters.category,
			);
		}

		// Filter by availability
		if (filters.availability && filters.availability !== "all") {
			if (filters.availability === "available") {
				result = result.filter((service) => service.isActive);
			} else if (filters.availability === "unavailable") {
				result = result.filter((service) => !service.isActive);
			}
		}

		// Filter by price range (using user's pricing)
		// Note: API already filters pricing by userType, so service.pricing[0] is the user's price
		if (filters.priceRange) {
			const [minPrice, maxPrice] = filters.priceRange;
			result = result.filter((service) => {
				// Since API filters by userType, pricing array should only contain user's pricing
				const pricing = service.pricing?.[0];
				if (!pricing) return false;
				return pricing.price >= minPrice && pricing.price <= maxPrice;
			});
		}

		// Sort services
		if (sortBy === "price") {
			result.sort((a, b) => {
				// Since API filters by userType, pricing array should only contain user's pricing
				const priceA = a.pricing?.[0]?.price ?? 0;
				const priceB = b.pricing?.[0]?.price ?? 0;
				return sortDirection === "asc" ? priceA - priceB : priceB - priceA;
			});
		} else if (sortBy === "name") {
			result.sort((a, b) => {
				const comparison = a.name.localeCompare(b.name);
				return sortDirection === "asc" ? comparison : -comparison;
			});
		}

		return result;
	}, [
		allServices,
		filters.search,
		filters.category,
		filters.availability,
		filters.priceRange,
		sortBy,
		sortDirection,
	]);

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
						<ServiceFiltersComponent
							filters={filters}
							onFiltersChange={setFilters}
						/>

						{/* User Rate Info */}
						<Card className="mt-6 border-blue-200 bg-blue-50">
							<div className="p-4">
								<h3 className="font-semibold text-blue-800 text-lg">
									Your Pricing
								</h3>
								<div className="mt-2 flex items-center space-x-2">
									<Badge className="bg-blue-600">
										{getUserTypeLabel(userType)}
									</Badge>
								</div>
								<p className="mt-2 text-blue-700 text-sm">
									You receive special {getUserTypeLabel(userType)} pricing on
									all services.
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
									{filteredAndSortedServices.length} of {allServices.length}{" "}
									services
									{(filters.search ||
										(filters.category && filters.category !== "all") ||
										(filters.availability && filters.availability !== "all") ||
										(filters.priceRange &&
											(filters.priceRange[0] !== 0 ||
												filters.priceRange[1] !== 1000))) &&
										" match your filters"}
								</p>
							</div>
							<div className="flex items-center space-x-2">
								<Button
									onClick={() => {
										if (sortBy === "price") {
											setSortDirection(
												sortDirection === "asc" ? "desc" : "asc",
											);
										} else {
											setSortBy("price");
											setSortDirection("asc");
										}
									}}
									variant={sortBy === "price" ? "default" : "outline"}
								>
									<Filter className="mr-2 h-4 w-4" />
									Sort by Price
									{sortBy === "price" && (
										<span className="ml-2">
											{sortDirection === "asc" ? "↑" : "↓"}
										</span>
									)}
								</Button>
								<RouterButton
									className="bg-blue-600 hover:bg-blue-700"
									href="/bookings/new"
								>
									<Plus className="mr-2 h-4 w-4" />
									Create Booking
								</RouterButton>
							</div>
						</div>

						{loading ? (
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
								{Array.from(
									{ length: 6 },
									(_, index) => `skeleton-card-${index}`,
								).map((id) => (
									<Card className="transition-shadow" key={id}>
										<CardHeader>
											<div className="flex items-start justify-between">
												<div className="flex items-center space-x-3">
													<Skeleton className="h-10 w-10 rounded-lg" />
													<div className="flex-1">
														<Skeleton className="mb-2 h-5 w-3/4" />
														<Skeleton className="h-4 w-1/2" />
													</div>
												</div>
												<Skeleton className="h-6 w-20 rounded-full" />
											</div>
										</CardHeader>
										<CardContent>
											<Skeleton className="mb-4 h-4 w-full" />
											<Skeleton className="mb-4 h-4 w-5/6" />
											<div className="space-y-3">
												<div className="flex items-center justify-between">
													<Skeleton className="h-4 w-16" />
													<Skeleton className="h-5 w-24 rounded-full" />
												</div>
												<div className="rounded-lg bg-blue-50 p-3">
													<div className="flex items-center justify-between">
														<Skeleton className="h-4 w-32" />
														<div className="text-right">
															<Skeleton className="mb-1 h-6 w-20" />
															<Skeleton className="h-4 w-24" />
														</div>
													</div>
												</div>
											</div>
											<div className="mt-4 flex items-center space-x-2">
												<Skeleton className="h-10 flex-1" />
												<Skeleton className="h-10 flex-1" />
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						) : filteredAndSortedServices.length === 0 ? (
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
								{filteredAndSortedServices.map((service) => (
									<ServiceCard
										key={service.id}
										onViewDetails={handleViewDetails}
										service={service}
										userType={userType}
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
