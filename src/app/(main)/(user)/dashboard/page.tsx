import { requireCurrentUser } from "@/shared/server/current-user";
import { DashboardClient } from "@/widgets/DashboardClient";

export default async function UserDashboard() {
	// Ensure user is authenticated
	await requireCurrentUser();

	return <DashboardClient />;
}
