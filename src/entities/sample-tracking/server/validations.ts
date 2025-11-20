import { z } from "zod";

export const UpdateSampleStatusSchema = z.object({
	status: z.enum([
		"pending",
		"received",
		"in_analysis",
		"analysis_complete",
		"return_requested",
		"returned",
	]),
});

export const SampleListQuerySchema = z.object({
	status: z.array(z.string()).optional(),
	q: z.string().optional(),
	userId: z.string().uuid().optional(),
	exclude: z.array(z.string()).optional(),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(10).max(100).default(25),
});
