import { BookingPage } from "@/app/widgets/booking-page";

export default function BookingRequestForm() {
	// TODO: Get user type and status from session/auth
	const userType = "mjiit_member" as const;
	const userStatus = undefined; // Get from session

	return <BookingPage userStatus={userStatus} userType={userType} />;
}
