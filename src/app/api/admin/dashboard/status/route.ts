import { getAdminDashboardStatus } from "@/entities/admin-dashboard/server/status-repository";
import { createProtectedHandler, forbidden } from "@/shared/lib/api-factory";

export const GET = createProtectedHandler(async (_req, user) => {
	if (user.role !== "lab_administrator") {
		return forbidden();
	}

	const status = await getAdminDashboardStatus();
	return Response.json(status);
});
