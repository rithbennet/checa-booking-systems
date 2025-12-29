import { redirect } from "next/navigation";
import { mapBookingToCreateBookingInput } from "@/entities/booking";
import { getAvailableEquipment } from "@/entities/booking/api/get-available-equipment";
import * as bookingService from "@/entities/booking/server/booking.service";
import { getServices } from "@/entities/service/api/get-services";
import { getUserProfile } from "@/entities/user/server/profile-repository";
import type { BookingProfile } from "@/features/bookings/form";
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

	const userProfile = await getUserProfile(userId);
	if (userProfile) {
		profile = {
			...profile,
			fullName: `${userProfile.firstName} ${userProfile.lastName}`,
			email: userProfile.email,
			phone: userProfile.phone ?? null,
			userType: userProfile.userType as BookingProfile["userType"],
			academicType: userProfile.academicType as BookingProfile["academicType"],
			userIdentifier: userProfile.userIdentifier ?? null,
			supervisorName: userProfile.supervisorName ?? null,
			organization: {
				facultyId: userProfile.organization.facultyId ?? null,
				departmentId: userProfile.organization.departmentId ?? null,
				ikohzaId: userProfile.organization.ikohzaId ?? null,
				companyId: userProfile.organization.companyId ?? null,
				companyBranchId: userProfile.organization.companyBranchId ?? null,
			},
		};
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
	if (booking.status !== "draft" && booking.status !== "revision_requested") {
		redirect(`/bookings/${bookingId}`);
	}

	const initialData = mapBookingToCreateBookingInput(
		booking as Parameters<typeof mapBookingToCreateBookingInput>[0],
	);

	// No pre-selection via search params; user selects services within the form

	return (
		<BookingWizardPage
			bookingId={bookingId}
			bookingStatus={booking.status}
			equipment={equipment}
			initialData={initialData}
			key={bookingId}
			mode="edit"
			profile={profile}
			reviewNotes={booking.reviewNotes}
			services={services}
			userId={userId}
			userStatus={userStatus}
			userType={userType}
		/>
	);
}
