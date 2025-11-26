/**
 * Admin Service Management Types
 *
 * Types and Zod schemas for service administration
 */

import { z } from "zod";

// ============================================
// Enums
// ============================================

export const serviceCategoryEnum = z.enum([
	"ftir_atr",
	"ftir_kbr",
	"uv_vis_absorbance",
	"uv_vis_reflectance",
	"bet_analysis",
	"hplc_pda",
	"working_space",
]);

export const userTypeEnum = z.enum([
	"mjiit_member",
	"utm_member",
	"external_member",
]);

export type ServiceCategory = z.infer<typeof serviceCategoryEnum>;
export type UserType = z.infer<typeof userTypeEnum>;

// ============================================
// Service Pricing DTO
// ============================================

export const servicePricingSchema = z.object({
	userType: userTypeEnum,
	price: z.number().min(0),
	unit: z.string().min(1),
});

export type ServicePricingDTO = z.infer<typeof servicePricingSchema>;

// ============================================
// Service Add-On DTO
// ============================================

export const serviceAddOnSchema = z.object({
	addOnId: z.string().uuid(),
	name: z.string(),
	defaultAmount: z.number(),
	isEnabled: z.boolean(),
	customAmount: z.number().nullable(),
});

export type ServiceAddOnDTO = z.infer<typeof serviceAddOnSchema>;

// ============================================
// Admin Service List Item
// ============================================

export const adminServiceListItemSchema = z.object({
	id: z.string().uuid(),
	code: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	category: serviceCategoryEnum,
	isActive: z.boolean(),
	requiresSample: z.boolean(),
	minSampleMass: z.number().nullable(),
	operatingHours: z.string().nullable(),
	minPrice: z.number().nullable(),
	maxPrice: z.number().nullable(),
	pricingCount: z.number(),
	updatedAt: z.string(),
});

export type AdminServiceListItem = z.infer<typeof adminServiceListItemSchema>;

// ============================================
// Admin Service Detail
// ============================================

export const adminServiceDetailSchema = z.object({
	id: z.string().uuid(),
	code: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	category: serviceCategoryEnum,
	isActive: z.boolean(),
	requiresSample: z.boolean(),
	minSampleMass: z.number().nullable(),
	operatingHours: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
	pricing: z.array(servicePricingSchema),
	addOns: z.array(serviceAddOnSchema),
});

export type AdminServiceDetail = z.infer<typeof adminServiceDetailSchema>;

// ============================================
// Admin Service Filters
// ============================================

export const adminServiceFiltersSchema = z.object({
	search: z.string().optional(),
	category: z.union([serviceCategoryEnum, z.literal("all")]).optional(),
	status: z.enum(["all", "active", "inactive"]).optional(),
	page: z.number().int().min(1).optional(),
	perPage: z.number().int().min(1).max(100).optional(),
});

export type AdminServiceFilters = z.infer<typeof adminServiceFiltersSchema>;

// ============================================
// Admin Service List Response
// ============================================

export interface AdminServiceListResponse {
	items: AdminServiceListItem[];
	total: number;
	page: number;
	perPage: number;
}

// ============================================
// Service Upsert Input
// ============================================

export const serviceUpsertInputSchema = z.object({
	id: z.string().uuid().optional(), // If present, update; otherwise, create
	code: z.string().min(1).max(50),
	name: z.string().min(1).max(200),
	description: z.string().nullable().optional(),
	category: serviceCategoryEnum,
	isActive: z.boolean().default(true),
	requiresSample: z.boolean().default(true),
	minSampleMass: z.number().nullable().optional(),
	operatingHours: z.string().max(100).nullable().optional(),
	pricing: z.array(servicePricingSchema),
	addOns: z
		.array(
			z.object({
				addOnId: z.string().uuid(),
				isEnabled: z.boolean(),
				customAmount: z.number().nullable().optional(),
			}),
		)
		.optional(),
});

export type ServiceUpsertInput = z.infer<typeof serviceUpsertInputSchema>;
