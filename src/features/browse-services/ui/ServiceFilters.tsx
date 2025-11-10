"use client";

import { Filter, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/shadcn/card";
import { Input } from "@/shared/ui/shadcn/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/shadcn/select";
import { Slider } from "@/shared/ui/shadcn/slider";
import type { ServiceFilters, ServiceCategory } from "@/entities/service";

interface ServiceFiltersProps {
	filters: ServiceFilters;
	onFiltersChange: (filters: ServiceFilters) => void;
}

export function ServiceFilters({
	filters,
	onFiltersChange,
}: ServiceFiltersProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Filter Services</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div>
					<label
						className="mb-2 block font-medium text-gray-700 text-sm"
						htmlFor="service-search"
					>
						Search
					</label>
					<div className="relative">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
						<Input
							className="pl-10"
							id="service-search"
							onChange={(e) =>
								onFiltersChange({ ...filters, search: e.target.value })
							}
							placeholder="Search services..."
							value={filters.search || ""}
						/>
					</div>
				</div>

				<div>
					<label
						className="mb-2 block font-medium text-gray-700 text-sm"
						htmlFor="service-category-filter"
					>
						Service Category
					</label>
					<Select
						onValueChange={(value) =>
							onFiltersChange({
								...filters,
								category: value === "all" ? "all" : (value as ServiceCategory),
							})
						}
						value={filters.category || "all"}
					>
						<SelectTrigger id="service-category-filter">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Categories</SelectItem>
							<SelectItem value="ftir_atr">FTIR Spectroscopy - ATR</SelectItem>
							<SelectItem value="ftir_kbr">FTIR Spectroscopy - KBr</SelectItem>
							<SelectItem value="uv_vis_absorbance">
								UV-Vis - Absorbance/Transmittance
							</SelectItem>
							<SelectItem value="uv_vis_reflectance">
								UV-Vis - Reflectance
							</SelectItem>
							<SelectItem value="bet_analysis">BET Analysis</SelectItem>
							<SelectItem value="hplc_pda">HPLC-PDA</SelectItem>
							<SelectItem value="working_space">Working Space</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div>
					<label
						className="mb-2 block font-medium text-gray-700 text-sm"
						htmlFor="price-range"
					>
						Price Range (RM {filters.priceRange?.[0] || 0} - RM{" "}
						{filters.priceRange?.[1] || 1000})
					</label>
					<Slider
						className="mt-2"
						id="price-range"
						max={1000}
						onValueChange={(value) =>
							onFiltersChange({
								...filters,
								priceRange: [value[0] ?? 0, value[1] ?? 1000],
							})
						}
						step={10}
						value={filters.priceRange || [0, 1000]}
					/>
				</div>

				<div>
					<label
						className="mb-2 block font-medium text-gray-700 text-sm"
						htmlFor="availability-filter"
					>
						Availability
					</label>
					<Select
						onValueChange={(value) =>
							onFiltersChange({
								...filters,
								availability: value as ServiceFilters["availability"],
							})
						}
						value={filters.availability || "all"}
					>
						<SelectTrigger id="availability-filter">
							<SelectValue placeholder="All Availability" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Availability</SelectItem>
							<SelectItem value="available">Available Now</SelectItem>
							<SelectItem value="limited">Limited Slots</SelectItem>
							<SelectItem value="upcoming">Upcoming</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</CardContent>
		</Card>
	);
}

