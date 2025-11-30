import { rejectPayment } from "@/entities/payment/server/repository";
import {
	badRequest,
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

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

			return Response.json(result);
		} catch (error) {
			console.error("Error rejecting payment:", error);
			if (error instanceof Error) {
				return badRequest(error.message);
			}
			return serverError("Failed to reject payment");
		}
	},
);
