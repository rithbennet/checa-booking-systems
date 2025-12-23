import { verifyPayment } from "@/entities/payment/server/repository";
import {
	badRequest,
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";
import { logAuditEvent } from "@/shared/lib/audit-log";
import { logger } from "@/shared/lib/logger";

/**
 * POST /api/admin/finance/payments/[paymentId]/verify
 * Verify a pending payment
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

			const result = await verifyPayment({
				paymentId,
				verifierId: user.id,
				notes,
			});

			// Log audit event (fire-and-forget)
			void logAuditEvent({
				userId: user.id,
				action: "payment.verify",
				entity: "payment",
				entityId: paymentId,
				metadata: {
					verifiedBy: user.id,
					notes: notes || undefined,
					amount: result.amount ? Number(result.amount) : undefined,
				},
			}).catch((error) => {
				logger.error(
					{ error, paymentId },
					"Failed to log audit event for payment verification",
				);
			});

			return Response.json(result);
		} catch (error) {
			const paymentId = params?.paymentId;
			logger.error({ error, paymentId }, "Error verifying payment");
			if (error instanceof Error) {
				return badRequest(error.message);
			}
			return serverError("Failed to verify payment");
		}
	},
);
