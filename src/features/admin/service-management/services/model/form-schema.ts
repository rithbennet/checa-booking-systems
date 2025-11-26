/**
 * Service Admin Form Schema
 *
 * Zod schema and types for the service admin form
 */

import { z } from "zod";

// User type enum for pricing
export const userTypeEnum = z.enum([
	"mjiit_member",
	"utm_member",
	"external_member",
]);

// Service category enum
export const serviceCategoryEnum = z.enum([
	"ftir_atr",
	"ftir_kbr",
	"uv_vis_absorbance",
	"uv_vis_reflectance",
	"bet_analysis",
	"hplc_pda",
	"working_space",
]);

// Pricing row schema
export const pricingRowSchema = z.object({
	userType: userTypeEnum,
	price: z.number().min(0, "Price must be non-negative"),
	unit: z.string().min(1, "Unit is required"),
});

// Add-on row schema
export const addOnRowSchema = z.object({
	addOnId: z.string().uuid(),
	isEnabled: z.boolean(),
	customAmount: z.number().nullable().optional(),
});

// Main form schema
export const serviceFormSchema = z.object({
	id: z.string().uuid().optional(),
	code: z
		.string()
		.min(1, "Code is required")
		.max(50, "Code must be 50 characters or less"),
	name: z
		.string()
		.min(1, "Name is required")
		.max(200, "Name must be 200 characters or less"),
	description: z.string().nullable().optional(),
	category: serviceCategoryEnum,
	requiresSample: z.boolean(),
	isActive: z.boolean(),
	minSampleMass: z.number().nullable().optional(),
	operatingHours: z.string().max(100).nullable().optional(),
	pricing: z.array(pricingRowSchema),
	addOns: z.array(addOnRowSchema).optional(),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;
export type PricingRow = z.infer<typeof pricingRowSchema>;
export type AddOnRow = z.infer<typeof addOnRowSchema>;

// Category display labels
export const serviceCategoryLabels: Record<string, string> = {
	ftir_atr: "FTIR-ATR",
	ftir_kbr: "FTIR-KBr",
	uv_vis_absorbance: "UV-Vis Absorbance",
	uv_vis_reflectance: "UV-Vis Reflectance",
	bet_analysis: "BET Analysis",
	hplc_pda: "HPLC-PDA",
	working_space: "Working Space",
};

// User type display labels
export const userTypeLabels: Record<string, string> = {
	mjiit_member: "MJIIT Member",
	utm_member: "UTM Member",
	external_member: "External Member",
};

// Default pricing for all user types
export const defaultPricing: PricingRow[] = [
	{ userType: "mjiit_member", price: 0, unit: "sample" },
	{ userType: "utm_member", price: 0, unit: "sample" },
	{ userType: "external_member", price: 0, unit: "sample" },
];
