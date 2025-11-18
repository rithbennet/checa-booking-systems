import { redirect } from "next/navigation";
import { AdminBookingListPage } from "@/features/booking-review";
import { requireCurrentUser } from "@/shared/server/current-user";

export default async function AdminBookingsPage() {
	const user = await requireCurrentUser();

	// Check if user is admin
	if (user.role !== "lab_administrator") {
		redirect("/dashboard");
	}

	return <AdminBookingListPage />;
}
