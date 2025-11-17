import { z } from "zod";

export const SortKeyEnum = z.enum([
	"updated_at:desc",
	"updated_at:asc",
	"created_at:desc",
	"created_at:asc",
	"status:asc",
	"amount:desc",
	"amount:asc",
]);

export const PageSizeEnum = z.enum(["10", "15", "25"]).transform(Number);

export const TypeEnum = z.enum(["all", "analysis_only", "working_space"]);

export const FiltersSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	pageSize: PageSizeEnum.default("25"),
	sort: SortKeyEnum.default("updated_at:desc"),
	q: z.string().optional().default(""),
	status: z.array(z.string()).optional().default([]),
	createdFrom: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	createdTo: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	type: TypeEnum.default("all"),
});

export type FiltersState = z.infer<typeof FiltersSchema>;
export type SortKey = z.infer<typeof SortKeyEnum>;
