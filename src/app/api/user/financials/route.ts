import { getUserFinancials } from "@/entities/booking/server/user-financials-repository";
import { createProtectedHandler } from "@/shared/lib/api-factory";

/**
 * GET /api/user/financials
 * Returns the current user's financial records (invoices with payment status)
 */
export const GET = createProtectedHandler(
	async (_req, user) => {
		const data = await getUserFinancials(user.id);
		return data;
	},
	{ requireActive: true },
);
