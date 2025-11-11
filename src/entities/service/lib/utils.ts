/**
 * Service entity utilities
 */

import type { Service, ServicePricing, UserType } from "../model/types";

/**
 * Get the price for a service based on user type
 */
export function getServicePrice(
	service: Service,
	userType: UserType,
): { price: number; unit: string } | null {
	if (!service.pricing || service.pricing.length === 0) {
		return null;
	}

	const pricing = service.pricing.find(
		(p) => p.userType === userType && !p.effectiveTo,
	);

	if (!pricing) {
		return null;
	}

	return {
		price: Number(pricing.price),
		unit: pricing.unit,
	};
}

/**
 * Get all pricing tiers for a service
 */
export function getServicePricingTiers(
	service: Service,
): Record<UserType, ServicePricing | null> {
	const tiers: Record<UserType, ServicePricing | null> = {
		mjiit_member: null,
		utm_member: null,
		external_member: null,
	};

	if (!service.pricing) {
		return tiers;
	}

	for (const pricing of service.pricing) {
		if (!pricing.effectiveTo) {
			tiers[pricing.userType] = pricing;
		}
	}

	return tiers;
}

/**
 * Format service category for display
 */
export function formatServiceCategory(category: Service["category"]): string {
	const categoryMap: Record<Service["category"], string> = {
		ftir_atr: "FTIR Spectroscopy - ATR",
		ftir_kbr: "FTIR Spectroscopy - KBr",
		uv_vis_absorbance: "UV-Vis Spectroscopy - Absorbance/Transmittance",
		uv_vis_reflectance: "UV-Vis Spectroscopy - Reflectance",
		bet_analysis: "Surface Area and Pore Analyzer (BET)",
		hplc_pda: "HPLC-Photodiode Array Detection",
		working_space: "Working Space",
	};

	return categoryMap[category] || category;
}

/**
 * Check if service is available
 */
export function isServiceAvailable(service: Service): boolean {
	return service.isActive;
}

/**
 * Format user type for display
 */
export function formatUserType(userType: UserType): string {
	const typeMap: Record<UserType, string> = {
		mjiit_member: "MJIIT Member",
		utm_member: "UTM Member",
		external_member: "External Client",
	};

	return typeMap[userType] || userType;
}
