/**
 * Admin Booking List Schema Validations
 */

import { z } from "zod";

export const AdminActionRequestSchema = z.object({
	action: z.enum(["approve", "reject", "request_revision"]),
	comment: z.string().optional(),
});

export const AdminBulkActionRequestSchema = z.object({
	action: z.enum(["approve", "reject", "request_revision", "delete"]),
	ids: z.array(z.string()).min(1),
	comment: z.string().optional(),
});

export const AdminListParamsSchema = z.object({
	page: z.number().int().positive().default(1),
	pageSize: z.union([z.literal(25), z.literal(50), z.literal(100)]).default(25),
	sort: z
		.enum([
			"updated_newest",
			"updated_oldest",
			"created_newest",
			"created_oldest",
			"amount_high",
			"amount_low",
		])
		.default("updated_newest"),
	query: z.string().optional(),
	status: z.array(z.string()).optional(),
	type: z.enum(["all", "analysis_only", "workspace_only"]).optional(),
});

export type AdminActionRequest = z.infer<typeof AdminActionRequestSchema>;
export type AdminBulkActionRequest = z.infer<
	typeof AdminBulkActionRequestSchema
>;
export type AdminListParams = z.infer<typeof AdminListParamsSchema>;
