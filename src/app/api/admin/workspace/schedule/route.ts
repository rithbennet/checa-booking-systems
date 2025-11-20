import { NextResponse } from "next/server";
import { ZodError, type z } from "zod";
import { getWorkspaceSchedule } from "@/entities/workspace-booking/server/actions";
import { WorkspaceScheduleQuerySchema } from "@/entities/workspace-booking/server/validations";
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
		const from = searchParams.get("from");
		const to = searchParams.get("to");

		// Validate query params
		let validated: z.infer<typeof WorkspaceScheduleQuerySchema>;
		try {
			validated = WorkspaceScheduleQuerySchema.parse({ from, to });
		} catch (zodError) {
			if (zodError instanceof ZodError) {
				return badRequest("from and to date parameters are required");
			}
			throw zodError;
		}

		const result = await getWorkspaceSchedule({
			from: validated.from,
			to: validated.to,
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("[admin/workspace/schedule GET]", error);
		if (error instanceof Error) {
			if (
				error.message.includes("Invalid date format") ||
				error.message.includes("from date must be before")
			) {
				return badRequest(error.message);
			}
		}
		return serverError("Internal server error");
	}
});
