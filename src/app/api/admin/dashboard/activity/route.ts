import { getAdminDashboardActivity } from "@/entities/admin-dashboard/server/activity-repository";
import { createProtectedHandler, forbidden } from "@/shared/lib/api-factory";

export const GET = createProtectedHandler(async (_req, user) => {
	if (user.role !== "lab_administrator") {
		return forbidden();
	}

	const activity = await getAdminDashboardActivity();
	return Response.json(activity);
});
