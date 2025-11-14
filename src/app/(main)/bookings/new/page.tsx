import { getAvailableEquipment } from "@/entities/booking/api/get-available-equipment";
import { getInvoicePayerProfile } from "@/entities/invoice/api/get-invoice-payer-profile";
import { getServices } from "@/entities/service/api/get-services";
import type { BookingProfile } from "@/features/booking-form";
import { mapRoleToUserType } from "@/shared/lib/user-type-mapper";
import { auth } from "@/shared/server/auth";
import { BookingPage } from "@/widgets/booking-page";

export default async function BookingRequestForm() {
	const session = await auth();

	const userId = session?.user?.id ?? "anonymous";
	const userType = mapRoleToUserType(session?.user?.role ?? null);
	const userStatus = session?.user?.status ?? undefined;

	// Fetch user profile for billing information
	let profile: BookingProfile = {
		fullName: session?.user?.name || "Unknown",
		email: session?.user?.email ?? null,
	};

	if (session?.user?.email) {
		const invoiceProfile = await getInvoicePayerProfile({
			email: session.user.email,
		});

		if (invoiceProfile) {
			profile = {
				...profile,
				...invoiceProfile,
				academicType:
					invoiceProfile.academicType as BookingProfile["academicType"],
			};
		}
	}

	const [services, equipment] = await Promise.all([
		getServices({
			filters: { userType },
		}),
		getAvailableEquipment(),
	]);

	const mode = "new";
	const bookingKey = `${userId}-${mode}-new`;

	return (
		<BookingPage
			equipment={equipment}
			key={bookingKey}
			mode={mode}
			profile={profile}
			services={services}
			userId={userId}
			userStatus={userStatus}
			userType={userType}
		/>
	);
}
