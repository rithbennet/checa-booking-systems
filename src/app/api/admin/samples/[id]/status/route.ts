import { NextResponse } from "next/server";
import { ZodError, type z } from "zod";
import { updateSampleStatus } from "@/entities/sample-tracking/server/actions";
import { UpdateSampleStatusSchema } from "@/entities/sample-tracking/server/validations";
import {
	badRequest,
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

export const PATCH = createProtectedHandler(
	async (request: Request, user, { params }) => {
		try {
			if (user.role !== "lab_administrator") return forbidden();

			const sampleId = params?.id;
			if (!sampleId) return badRequest("Sample ID is required");

			const body = await request.json();

			// Validate request body
			let validated: z.infer<typeof UpdateSampleStatusSchema>;
			try {
				validated = UpdateSampleStatusSchema.parse(body);
			} catch (zodError) {
				if (zodError instanceof ZodError) {
					return badRequest("Invalid request body");
				}
				throw zodError;
			}

			const result = await updateSampleStatus({
				sampleId,
				status: validated.status,
				updatedBy: user.id,
			});

			return NextResponse.json(result);
		} catch (error) {
			console.error("[admin/samples/[id]/status PATCH]", error);
			if (error instanceof Error) {
				if (error.message === "Sample not found") {
					return badRequest("Sample not found");
				}
			}
			return serverError("Internal server error");
		}
	},
);
