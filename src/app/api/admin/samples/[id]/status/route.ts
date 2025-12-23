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
import { logAuditEvent } from "@/shared/lib/audit-log";
import { logger } from "@/shared/lib/logger";

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

			// Log audit event (fire-and-forget to avoid blocking response)
			try {
				await logAuditEvent({
					userId: user.id,
					action: "sample.status_change",
					entity: "sample_tracking",
					entityId: sampleId,
					metadata: {
						newStatus: validated.status,
						sampleIdentifier: result.sampleIdentifier,
					},
				});
			} catch (auditError) {
				logger.error(
					{ error: auditError, sampleId },
					"Failed to log audit event for sample status change",
				);
			}

			return NextResponse.json(result);
		} catch (error) {
			const sampleId = params?.id;
			logger.error({ error, sampleId }, "[admin/samples/[id]/status PATCH]");
			if (error instanceof Error) {
				if (error.message === "Sample not found") {
					return badRequest("Sample not found");
				}
			}
			return serverError("Internal server error");
		}
	},
);
