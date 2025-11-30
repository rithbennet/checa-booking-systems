/**
 * Admin Add-On Repository
 *
 * Prisma queries for global add-on catalog management
 */

import { db } from "@/shared/server/db";
import type { AddOnApplicableTo, GlobalAddOn } from "../model/types";

export interface AddOnCreateInput {
	name: string;
	description: string | null;
	defaultAmount: number;
	applicableTo: AddOnApplicableTo;
	isActive: boolean;
}

export interface AddOnUpdateInput {
	id: string;
	name: string;
	description: string | null;
	defaultAmount: number;
	applicableTo: AddOnApplicableTo;
	isActive: boolean;
}

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

/**
 * Create a new global add-on
 */
export async function createGlobalAddOn(
	input: AddOnCreateInput,
): Promise<GlobalAddOn> {
	const addOn = await db.globalAddOnCatalog.create({
		data: {
			name: input.name,
			description: input.description,
			defaultAmount: input.defaultAmount,
			applicableTo: input.applicableTo,
			isActive: input.isActive,
		},
	});

	return {
		id: addOn.id,
		name: addOn.name,
		description: addOn.description,
		defaultAmount: Number(addOn.defaultAmount),
		applicableTo: addOn.applicableTo as AddOnApplicableTo,
		isActive: addOn.isActive,
	};
}

/**
 * Update an existing global add-on
 */
export async function updateGlobalAddOn(
	input: AddOnUpdateInput,
): Promise<GlobalAddOn> {
	const addOn = await db.globalAddOnCatalog.update({
		where: { id: input.id },
		data: {
			name: input.name,
			description: input.description,
			defaultAmount: input.defaultAmount,
			applicableTo: input.applicableTo,
			isActive: input.isActive,
		},
	});

	return {
		id: addOn.id,
		name: addOn.name,
		description: addOn.description,
		defaultAmount: Number(addOn.defaultAmount),
		applicableTo: addOn.applicableTo as AddOnApplicableTo,
		isActive: addOn.isActive,
	};
}

/**
 * Toggle add-on active status
 */
export async function toggleAddOnActive(
	id: string,
	isActive: boolean,
): Promise<GlobalAddOn> {
	const addOn = await db.globalAddOnCatalog.update({
		where: { id },
		data: { isActive },
	});

	return {
		id: addOn.id,
		name: addOn.name,
		description: addOn.description,
		defaultAmount: Number(addOn.defaultAmount),
		applicableTo: addOn.applicableTo as AddOnApplicableTo,
		isActive: addOn.isActive,
	};
}

/**
 * Delete a global add-on
 */
export async function deleteGlobalAddOn(id: string): Promise<void> {
	await db.globalAddOnCatalog.delete({
		where: { id },
	});
}
