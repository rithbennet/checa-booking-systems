import { getAvailableEquipment } from "@/entities/booking/api/get-available-equipment";
import { getServices } from "@/entities/service/api/get-services";
import { mapRoleToUserType } from "@/shared/lib/user-type-mapper";
import { auth } from "@/shared/server/auth";
import { BookingPage } from "@/widgets/booking-page";

export default async function BookingRequestForm() {
	const session = await auth();

	const userType = mapRoleToUserType(session?.user?.role ?? null);
	const userStatus = session?.user?.status ?? undefined;

	const [services, equipment] = await Promise.all([
		getServices({
			filters: { userType },
		}),
		getAvailableEquipment(),
	]);

	return (
		<BookingPage
			equipment={equipment}
			services={services}
			userStatus={userStatus}
			userType={userType}
		/>
	);
}
