import { getUserSampleResults } from "@/entities/sample-tracking/server/user-results-repository";
import { createProtectedHandler } from "@/shared/lib/api-factory";

/**
 * GET /api/user/samples
 * Returns the current user's sample tracking records with payment status
 */
export const GET = createProtectedHandler(
	async (_req, user) => {
		const data = await getUserSampleResults(user.id);
		return data;
	},
	{ requireActive: true },
);
