import { z } from "zod";

export const SampleFiltersSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(10).max(100).default(25),
	q: z.string().optional().default(""),
	status: z.array(z.string()).optional().default([]),
});

export type SampleFiltersState = z.infer<typeof SampleFiltersSchema>;
