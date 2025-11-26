/**
 * Global Add-On Catalog Types
 *
 * Types for the global add-on catalog (read-only for service admin forms)
 */

import { z } from "zod";

// ============================================
// Add-On Applicable To Enum
// ============================================

export const addOnApplicableToEnum = z.enum(["sample", "workspace", "both"]);

export type AddOnApplicableTo = z.infer<typeof addOnApplicableToEnum>;

// ============================================
// Global Add-On
// ============================================

export const globalAddOnSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	description: z.string().nullable(),
	defaultAmount: z.number(),
	applicableTo: addOnApplicableToEnum,
	isActive: z.boolean(),
});

export type GlobalAddOn = z.infer<typeof globalAddOnSchema>;
