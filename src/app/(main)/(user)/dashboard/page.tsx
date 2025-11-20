import { requireCurrentUser } from "@/shared/server/current-user";
import { DashboardClient } from "@/widgets/DashboardClient";

export default async function UserDashboard() {
	const currentUser = await requireCurrentUser();

	return <DashboardClient userId={currentUser.appUserId} />;
}
