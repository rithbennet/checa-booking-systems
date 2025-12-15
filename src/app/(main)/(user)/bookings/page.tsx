import { BookingListPageClient } from "@/features/bookings/user/list/ui/BookingListPage.client";
import { requireCurrentUser } from "@/shared/server/current-user";

export default async function BookingsPage() {
	const me = await requireCurrentUser();
	return <BookingListPageClient userStatus={me.status} />;
}
