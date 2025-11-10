/**
 * Service entity types
 *
 * This file contains type definitions for the Service entity.
 * Entities represent core business concepts.
 */

export type UserType = "mjiit_member" | "utm_member" | "external_member";

export type ServiceCategory =
	| "ftir_atr"
	| "ftir_kbr"
	| "uv_vis_absorbance"
	| "uv_vis_reflectance"
	| "bet_analysis"
	| "hplc_pda"
	| "working_space";

export interface ServicePricing {
	id: string;
	serviceId: string;
	userType: UserType;
	price: number;
	unit: string;
	effectiveFrom: Date;
	effectiveTo?: Date;
}

export interface Service {
	id: string;
	code: string;
	name: string;
	description?: string;
	category: ServiceCategory;
	isActive: boolean;
	requiresSample: boolean;
	minSampleMass?: number;
	operatingHours?: string;
	createdAt: Date;
	updatedAt: Date;
	pricing?: ServicePricing[];
}

export interface ServiceWithPricing extends Service {
	pricingByUserType: Record<UserType, ServicePricing | null>;
	currentPrice?: number;
	currentUnit?: string;
}

export interface ServiceFilters {
	search?: string;
	category?: ServiceCategory | "all";
	priceRange?: [number, number];
	availability?: "all" | "available" | "limited" | "upcoming";
	userType?: UserType;
}

export interface ServiceSortOption {
	field: "name" | "price" | "category";
	direction: "asc" | "desc";
}

