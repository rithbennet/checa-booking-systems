/**
 * Admin Add-On Repository
 *
 * Prisma queries for global add-on catalog (read-only)
 */

import { db } from "@/shared/server/db";
import type { AddOnApplicableTo, GlobalAddOn } from "../model/types";

/**
 * Get all active global add-ons
 */
export async function getGlobalAddOns(): Promise<GlobalAddOn[]> {
	const addOns = await db.globalAddOnCatalog.findMany({
		where: {
			isActive: true,
		},
		orderBy: { name: "asc" },
	});

	return addOns.map((addOn) => ({
		id: addOn.id,
		name: addOn.name,
		description: addOn.description,
		defaultAmount: Number(addOn.defaultAmount),
		applicableTo: addOn.applicableTo as AddOnApplicableTo,
		isActive: addOn.isActive,
	}));
}

/**
 * Get all global add-ons (including inactive) - for admin purposes
 */
export async function getAllGlobalAddOns(): Promise<GlobalAddOn[]> {
	const addOns = await db.globalAddOnCatalog.findMany({
		orderBy: { name: "asc" },
	});

	return addOns.map((addOn) => ({
		id: addOn.id,
		name: addOn.name,
		description: addOn.description,
		defaultAmount: Number(addOn.defaultAmount),
		applicableTo: addOn.applicableTo as AddOnApplicableTo,
		isActive: addOn.isActive,
	}));
}
