import { mapRoleToUserType } from "@/shared/lib/user-type-mapper";
import { auth } from "@/shared/server/auth";
import { BookingPage } from "@/widgets/booking-page";

export default async function BookingRequestForm() {
	const session = await auth();

	// Get user type and status from session
	const userType = mapRoleToUserType(session?.user?.role ?? null);
	const userStatus = session?.user?.status ?? undefined;

	return <BookingPage userStatus={userStatus} userType={userType} />;
}
