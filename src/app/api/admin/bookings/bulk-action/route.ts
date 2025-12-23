import { doBulkAdminAction } from "@/entities/booking/review/server/actions";
import { BulkActionSchema } from "@/entities/booking/review/server/validations";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";
import { logAuditEvent } from "@/shared/lib/audit-log";
import { logger } from "@/shared/lib/logger";

function computeStatus(
	resultsArray: { id: string; ok: boolean; error?: string }[] | undefined,
): "succeeded" | "all_succeeded" | "partial" | "all_failed" {
	if (resultsArray === undefined) return "succeeded";
	if (resultsArray.every((r) => r.ok)) return "all_succeeded";
	if (resultsArray.some((r) => r.ok)) return "partial";
	return "all_failed";
}

export const POST = createProtectedHandler(async (request: Request, user) => {
	try {
		if (user.role !== "lab_administrator") return forbidden();
		const body = await request.json();

		const validated = BulkActionSchema.parse(body);

		const result = await doBulkAdminAction({
			ids: validated.ids,
			adminUserId: user.id,
			action: validated.action,
			comment: validated.comment,
		});

		// Extract concise summary for audit (avoid logging full result which may be verbose/sensitive)
		type BulkActionResult =
			| { ok: true }
			| { results: { id: string; ok: boolean; error?: string }[] };

		const resultTyped = result as BulkActionResult;
		const resultsArray =
			"results" in resultTyped ? resultTyped.results : undefined;

		const auditSummary = {
			successCount: resultsArray
				? resultsArray.filter((r) => r.ok).length
				: validated.ids.length,
			failureCount: resultsArray ? resultsArray.filter((r) => !r.ok).length : 0,
			status: computeStatus(resultsArray),
		};

		// Log audit event for bulk action (fire-and-forget)
		void logAuditEvent({
			userId: user.id,
			action: "booking.bulk_action",
			entity: "booking",
			metadata: {
				actionType: validated.action,
				affectedCount: validated.ids.length,
				comment: validated.comment
					? validated.comment.slice(0, 200)
					: undefined,
				...auditSummary,
			},
		}).catch((auditError) => {
			logger.error(
				{ error: auditError, userId: user.id },
				"Failed to log audit event for bulk action",
			);
		});

		return result;
	} catch (error) {
		logger.error(
			{ error, userId: user.id },
			"[admin/bookings/bulk-action POST]",
		);
		return serverError(
			error instanceof Error ? error.message : "Internal server error",
		);
	}
});
