import { NextResponse } from "next/server";
import { ZodError, type z } from "zod";
import { listSamples } from "@/entities/sample-tracking/server/actions";
import { SampleListQuerySchema } from "@/entities/sample-tracking/server/validations";
import {
	badRequest,
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

export const GET = createProtectedHandler(async (request: Request, user) => {
	try {
		if (user.role !== "lab_administrator") return forbidden();

		const { searchParams } = new URL(request.url);
		const status = searchParams.get("status")?.split(",").filter(Boolean);
		const q = searchParams.get("q") ?? undefined;
		const userId = searchParams.get("userId") ?? undefined;
		const exclude = searchParams.get("exclude")?.split(",").filter(Boolean);

		// Parse and validate query params
		let validated: z.infer<typeof SampleListQuerySchema>;
		try {
			validated = SampleListQuerySchema.parse({
				status,
				q,
				userId,
				exclude,
				page: searchParams.get("page"),
				pageSize: searchParams.get("pageSize"),
			});
		} catch (zodError) {
			if (zodError instanceof ZodError) {
				return badRequest("Invalid query parameters");
			}
			throw zodError;
		}

		const result = await listSamples(validated);

		return NextResponse.json(result);
	} catch (error) {
		console.error("[admin/samples GET]", error);
		return serverError("Internal server error");
	}
});
