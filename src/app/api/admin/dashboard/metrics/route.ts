import { getAdminDashboardMetrics } from "@/entities/admin-dashboard/server/metrics-repository";
import { createProtectedHandler, forbidden } from "@/shared/lib/api-factory";

export const GET = createProtectedHandler(async (_req, user) => {
	if (user.role !== "lab_administrator") {
		return forbidden();
	}

	const metrics = await getAdminDashboardMetrics();
	return Response.json(metrics);
});
