import { verifyPayment } from "@/entities/payment/server/repository";
import {
	badRequest,
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

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

			return Response.json(result);
		} catch (error) {
			console.error("Error verifying payment:", error);
			if (error instanceof Error) {
				return badRequest(error.message);
			}
			return serverError("Failed to verify payment");
		}
	},
);
