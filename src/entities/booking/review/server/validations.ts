import { z } from "zod";

export const AdminActionSchema = z.object({
	action: z.enum(["approve", "reject", "request_revision"]),
	comment: z.string().max(2000).optional(),
});

export const BulkActionSchema = z.object({
	action: z.enum(["approve", "reject", "request_revision", "delete"]),
	ids: z.array(z.string().uuid()).min(1),
	comment: z.string().max(2000).optional(),
});
