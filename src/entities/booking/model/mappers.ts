import type { BookingRequest, Service } from "generated/prisma";
import type { BookingDetailVM, BookingListItemVM } from "./types";

type DecimalLike = {
	toString: () => string;
};

type BookingWithRelations = BookingRequest & {
	user: {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
		userType?: string | null;
		ikohza?: { name: string } | null;
		facultyRelation?: { name: string } | null;
		departmentRelation?: { name: string } | null;
	};
	companyRelation?: { name: string } | null;
	companyBranch?: { name: string } | null;
	serviceItems: Array<{
		id: string;
		quantity: number;
		unitPrice: DecimalLike;
		totalPrice: DecimalLike;
		sampleName?: string | null;
		service: {
			id: string;
			name: string;
			category: Service["category"];
		};
	}>;
	workspaceBookings?: Array<{
		startDate?: Date | null;
		endDate?: Date | null;
		notes?: string | null;
	}>;
};

export function mapToBookingListItemVM(
	booking: BookingWithRelations,
): BookingListItemVM {
	return {
		id: booking.id,
		referenceNumber: booking.referenceNumber,
		createdAt: booking.createdAt.toISOString(),
		updatedAt: booking.updatedAt.toISOString(),
		status: booking.status,
		user: {
			id: booking.user.id,
			name: `${booking.user.firstName} ${booking.user.lastName}`,
			email: booking.user.email,
		},
		requesterType: booking.companyRelation ? "external" : "internal",
		organization: booking.companyRelation
			? {
					company: booking.companyRelation.name,
					branch: booking.companyBranch?.name,
				}
			: booking.user.ikohza ||
					booking.user.facultyRelation ||
					booking.user.departmentRelation
				? {
						ikohza: booking.user.ikohza?.name,
						faculty: booking.user.facultyRelation?.name,
						department: booking.user.departmentRelation?.name,
					}
				: undefined,
		totalAmount: booking.totalAmount.toString(),
		services: booking.serviceItems.map((item) => ({
			id: item.service.id,
			name: item.service.name,
			qty: item.quantity,
		})),
		projectTitle: booking.projectDescription ?? undefined,
		hasWorkspace: (booking.workspaceBookings?.length ?? 0) > 0,
	};
}

export function mapToBookingDetailVM(
	booking: BookingWithRelations,
): BookingDetailVM {
	const listItem = mapToBookingListItemVM(booking);

	const firstWorkspace = booking.workspaceBookings?.[0];

	return {
		...listItem,
		projectDescription: booking.projectDescription ?? undefined,
		preferredStartDate: booking.preferredStartDate?.toISOString(),
		preferredEndDate: booking.preferredEndDate?.toISOString(),
		serviceItems: booking.serviceItems.map((item) => ({
			id: item.id,
			service: {
				id: item.service.id,
				name: item.service.name,
				category: item.service.category,
			},
			quantity: item.quantity,
			unitPrice: item.unitPrice.toString(),
			totalPrice: item.totalPrice.toString(),
			sampleName: item.sampleName ?? undefined,
		})),
		workspace: firstWorkspace
			? {
					startDate: firstWorkspace.startDate?.toISOString(),
					endDate: firstWorkspace.endDate?.toISOString(),
					notes: firstWorkspace.notes ?? undefined,
				}
			: undefined,
		reviewNotes: booking.reviewNotes,
	};
}
