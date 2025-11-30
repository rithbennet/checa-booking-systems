/**
 * Add-On Form Schema
 *
 * Zod schema and types for add-on management forms
 */

import { z } from "zod";

export const addOnFormSchema = z.object({
	id: z.string().uuid().optional(),
	name: z.string().min(1, "Name is required").max(255),
	description: z.string().max(500).nullable(),
	defaultAmount: z.number().min(0, "Amount must be positive"),
	applicableTo: z.enum(["sample", "workspace", "both"]),
	isActive: z.boolean(),
});

export type AddOnFormValues = z.infer<typeof addOnFormSchema>;

export const applicableToLabels: Record<
	"sample" | "workspace" | "both",
	string
> = {
	sample: "Sample Analysis",
	workspace: "Workspace Booking",
	both: "Both",
};
