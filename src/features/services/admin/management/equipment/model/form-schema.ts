/**
 * Equipment Admin Form Schema
 *
 * Zod schema and types for the equipment admin form
 */

import { z } from "zod";

// Main form schema
export const equipmentFormSchema = z.object({
	id: z.string().uuid().optional(),
	name: z
		.string()
		.min(1, "Name is required")
		.max(100, "Name must be 100 characters or less"),
	description: z.string().nullable().optional(),
	isAvailable: z.boolean(),
	maintenanceNotes: z.string().nullable().optional(),
	expectedMaintenanceEnd: z.string().nullable().optional(),
});

export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;
