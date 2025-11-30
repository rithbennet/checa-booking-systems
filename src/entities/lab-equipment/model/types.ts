/**
 * Admin Lab Equipment Types
 *
 * Types and Zod schemas for equipment administration
 */

import { z } from "zod";

// ============================================
// Admin Equipment List Item
// ============================================

export const adminEquipmentListItemSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	description: z.string().nullable(),
	isAvailable: z.boolean(),
	hasMaintenanceNotes: z.boolean(),
	expectedMaintenanceEnd: z.string().nullable(),
	updatedAt: z.string(),
});

export type AdminEquipmentListItem = z.infer<
	typeof adminEquipmentListItemSchema
>;

// ============================================
// Admin Equipment Detail
// ============================================

export const adminEquipmentDetailSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	description: z.string().nullable(),
	isAvailable: z.boolean(),
	maintenanceNotes: z.string().nullable(),
	expectedMaintenanceEnd: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type AdminEquipmentDetail = z.infer<typeof adminEquipmentDetailSchema>;

// ============================================
// Admin Equipment Filters
// ============================================

export const adminEquipmentFiltersSchema = z.object({
	search: z.string().optional(),
	availability: z.enum(["all", "available", "unavailable"]).optional(),
	page: z.number().int().min(1).optional(),
	perPage: z.number().int().min(1).max(100).optional(),
});

export type AdminEquipmentFilters = z.infer<typeof adminEquipmentFiltersSchema>;

// ============================================
// Admin Equipment List Response
// ============================================

export interface AdminEquipmentListResponse {
	items: AdminEquipmentListItem[];
	total: number;
	page: number;
	perPage: number;
}

// ============================================
// Equipment Upsert Input
// ============================================

export const equipmentUpsertInputSchema = z.object({
	id: z.string().uuid().optional(),
	name: z.string().min(1).max(100),
	description: z.string().nullable().optional(),
	isAvailable: z.boolean().default(true),
	maintenanceNotes: z.string().nullable().optional(),
	expectedMaintenanceEnd: z.string().nullable().optional(),
});

export type EquipmentUpsertInput = z.infer<typeof equipmentUpsertInputSchema>;
