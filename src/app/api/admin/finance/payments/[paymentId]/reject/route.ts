import { rejectPayment } from "@/entities/payment/server/repository";
import {
	badRequest,
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";
import { logAuditEvent } from "@/shared/lib/audit-log";
import { logger } from "@/shared/lib/logger";
import { ValidationError } from "@/shared/server/errors";

/**
 * POST /api/admin/finance/payments/[paymentId]/reject
 * Reject a pending payment
 */
export const POST = createProtectedHandler(
	async (request: Request, user, { params }) => {
		try {
			if (user.role !== "lab_administrator") return forbidden();

			const paymentId = params?.paymentId;
			if (!paymentId) {
				return badRequest("Payment ID is required");
			}

			const body = await request.json().catch(() => ({}));
			const notes = body.notes as string | undefined;

			if (!notes || notes.trim().length === 0) {
				return badRequest("Rejection reason is required");
			}

			const result = await rejectPayment({
				paymentId,
				verifierId: user.id,
				notes,
			});

			// Log audit event
			await logAuditEvent({
				userId: user.id,
				action: "payment.reject",
				entity: "payment",
				entityId: paymentId,
				metadata: {
					rejectedBy: user.id,
					reason: notes,
					amount: result.amount ? Number(result.amount) : undefined,
				},
			});

			return Response.json(result);
		} catch (error) {
			const paymentId = params?.paymentId;
			logger.error({ error, paymentId }, "Error rejecting payment");
			// Handle validation errors (return 400)
			if (error instanceof ValidationError) {
				return Response.json(
					{
						error: error.error,
						...(error.details && { details: error.details }),
					},
					{ status: 400 },
				);
			}
			if (error instanceof Error) {
				return badRequest(error.message);
			}
			return serverError("Failed to reject payment");
		}
	},
);
