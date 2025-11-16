import { redirect } from "next/navigation";
import { mapBookingToCreateBookingInput } from "@/entities/booking";
import { getAvailableEquipment } from "@/entities/booking/api/get-available-equipment";
import * as bookingService from "@/entities/booking/server/booking.service";
import { getInvoicePayerProfile } from "@/entities/invoice/api/get-invoice-payer-profile";
import { getServices } from "@/entities/service/api/get-services";
import type { BookingProfile } from "@/features/booking-form";
import { mapRoleToUserType } from "@/shared/lib/user-type-mapper";
import { requireCurrentUser } from "@/shared/server/current-user";
import { BookingWizardPage } from "@/widgets/booking-wizard";

// Next.js generated PageProps may declare `params` as a Promise or be undefined.
// Make this optional and a Promise to match the generated type.
type PageProps = {
	params?: Promise<{ id: string }>;
};

export default async function EditBookingPage({ params }: PageProps) {
	const me = await requireCurrentUser();

	const userId = me.appUserId;
	const userType = mapRoleToUserType(me.role);
	const userStatus = me.status ?? undefined;

	// Fetch user profile for billing information
	let profile: BookingProfile = {
		fullName: me.name || "Unknown",
		email: me.email ?? null,
	};

	if (me.email) {
		const invoiceProfile = await getInvoicePayerProfile({
			email: me.email,
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


	// `params` may be a promise in Next.js route handlers — await before accessing
	const resolvedParams = await params;
	if (!resolvedParams || !resolvedParams.id) {
		// Missing params — redirect to bookings list
		redirect("/bookings");
	}
	const bookingId = resolvedParams.id;
	const booking = await bookingService.getBooking({ userId, bookingId });
	if (!booking) {
		// If missing, redirect to bookings list (alternatively render 404)
		redirect("/bookings");
	}
	if (booking.status !== "draft") {
		redirect(`/bookings/${bookingId}`);
	}

	const initialData = mapBookingToCreateBookingInput(
		booking as Parameters<typeof mapBookingToCreateBookingInput>[0],
	);

	// No pre-selection via search params; user selects services within the form

	return (
		<BookingWizardPage
			bookingId={bookingId}
			equipment={equipment}
			initialData={initialData}
			key={bookingId}
			mode="edit"
			profile={profile}
			services={services}
			userId={userId}
			userStatus={userStatus}
			userType={userType}
		/>
	);
}
