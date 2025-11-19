import type { Decimal } from "@prisma/client/runtime/library";
import type { ZodIssue } from "zod";
import type { BookingSaveDraftDto, BookingSubmitDto } from "./booking.dto";
import { bookingSubmitDto } from "./booking.dto";
import { mapDtoToNormalized } from "./booking.mapper";
import * as notifications from "./booking.notifications";
import * as repo from "./booking.repo";

const VALID_SAMPLE_TYPES = ["liquid", "solid", "powder", "solution"] as const;

function normalizeSampleType(value: unknown) {
	if (value === null || value === undefined) return undefined;
	if (
		typeof value === "string" &&
		VALID_SAMPLE_TYPES.includes(value as (typeof VALID_SAMPLE_TYPES)[number])
	) {
		return value as (typeof VALID_SAMPLE_TYPES)[number];
	}
	return undefined;
}

function normalizeOtherEquipmentRequests(value: unknown): string[] | undefined {
	if (Array.isArray(value)) {
		return value.filter((item): item is string => typeof item === "string");
	}
	if (typeof value === "string") {
		return [value];
	}
	if (value && typeof value === "object") {
		const collected: string[] = [];
		for (const entry of Object.values(value)) {
			if (typeof entry === "string") {
				collected.push(entry);
			} else if (Array.isArray(entry)) {
				collected.push(
					...entry.filter((item): item is string => typeof item === "string"),
				);
			}
		}
		return collected.length > 0 ? collected : undefined;
	}
	return undefined;
}

// Normalizes "specialEquipment" values that may have been stored as JSON objects
// into a flat string array, or undefined when empty.
function normalizeSpecialEquipment(value: unknown): string[] | undefined {
	return normalizeOtherEquipmentRequests(value);
}

/**
 * Service layer for booking operations
 * Encapsulates business logic and orchestrates repo + notification calls
 */

/**
 * Create a new draft booking
 */
export async function createDraft(params: { userId: string }) {
	const { userId } = params;

	const referenceNumber = repo.newReferenceNumber();

	const booking = await repo.createDraft({
		userId,
		referenceNumber,
	});

	return {
		bookingId: booking.id,
		referenceNumber: booking.referenceNumber,
	};
}

/**
 * Get booking with all related data
 * Enforces ownership
 */
export async function getBooking(params: {
	userId: string;
	bookingId: string;
}) {
	const { userId, bookingId } = params;

	await repo.ensureOwner(bookingId, userId);

	return repo.findBookingById(bookingId);
}

/**
 * Save draft booking
 * Validates ownership and draft status
 */
export async function saveDraft(params: {
	userId: string;
	bookingId: string;
	dto: BookingSaveDraftDto;
	userType: string;
}) {
	const { userId, bookingId, dto, userType } = params;

	// Ensure ownership
	await repo.ensureOwner(bookingId, userId);

	// Ensure status is draft or revision_requested
	const booking = await repo.findBookingById(bookingId);
	if (
		!booking ||
		(booking.status !== "draft" && booking.status !== "revision_requested")
	) {
		throw new Error(
			"Booking is not editable (must be in draft or revision_requested status)",
		);
	}

	// Update basic fields
	await repo.updateDraft({
		bookingId,
		step: dto.step,
		projectDescription: dto.projectDescription,
		preferredStartDate: dto.preferredStartDate,
		preferredEndDate: dto.preferredEndDate,
		notes: dto.notes,
	});

	// Map DTO to normalized structures with pricing
	if (dto.serviceItems || dto.workspaceBookings) {
		// Collect all service IDs
		const serviceIds = (dto.serviceItems ?? [])
			.map((item) => item.serviceId)
			.filter(Boolean);

		// Fetch pricing for all services
		const pricingMap = await repo.getServicePricings(
			serviceIds,
			userType,
			new Date(),
		);

		// Collect all add-on IDs
		const addOnIds = [
			...(dto.serviceItems ?? []).flatMap((item) => item.addOnCatalogIds ?? []),
			...(dto.workspaceBookings ?? []).flatMap(
				(ws) => ws.addOnCatalogIds ?? [],
			),
		];
		const uniqueAddOnIds = [...new Set(addOnIds)];

		// Fetch add-ons
		const addOnsMapRaw = await repo.getAddOnsByIds(uniqueAddOnIds);

		// Transform to match AddOnData interface
		const addOnsMap = new Map(
			Array.from(addOnsMapRaw.entries()).map(([id, addOn]) => [
				id,
				{
					id: addOn.id,
					name: addOn.name,
					amount: addOn.defaultAmount,
				},
			]),
		);

		// Resolve working_space monthly rate when workspace bookings are present
		let workspaceMonthlyRate: Decimal | undefined;
		if ((dto.workspaceBookings?.length ?? 0) > 0) {
			const wsService = await repo.getWorkingSpaceService();
			if (wsService) {
				const wsPricing = await repo.getServicePricing(
					wsService.id,
					userType,
					new Date(),
				);
				if (wsPricing) {
					workspaceMonthlyRate = wsPricing.price as unknown as Decimal;
				}
			}
		}

		// Map to normalized structures
		const { serviceItems, workspaceBookings, totalAmount } = mapDtoToNormalized(
			dto,
			pricingMap,
			addOnsMap,
			userType,
			workspaceMonthlyRate,
		);

		// Upsert service items
		if (dto.serviceItems) {
			const savedItems = await repo.upsertServiceItems({
				bookingId,
				items: serviceItems,
			});

			// Upsert add-ons for service items
			const perItemAddOns = savedItems
				.map((item, index) => ({
					bookingServiceItemId: item.id,
					serviceId: item.serviceId,
					addOnCatalogIds: serviceItems[index]?.addOnCatalogIds ?? [],
				}))
				.filter((p) => p.addOnCatalogIds.length > 0);

			if (perItemAddOns.length > 0 || workspaceBookings.length > 0) {
				await repo.upsertAddOns({
					bookingId,
					perItemAddOns,
					perWorkspaceAddOns: [],
				});
			}
		}

		// Upsert workspace bookings
		if (dto.workspaceBookings) {
			const savedWorkspaces = await repo.upsertWorkspaceBookings({
				bookingId,
				items: workspaceBookings,
			});

			// Upsert add-ons for workspace bookings
			const perWorkspaceAddOns = savedWorkspaces
				.map((ws, index) => ({
					workspaceBookingId: ws.id,
					addOnCatalogIds: workspaceBookings[index]?.addOnCatalogIds ?? [],
				}))
				.filter((p) => p.addOnCatalogIds.length > 0);

			if (perWorkspaceAddOns.length > 0) {
				await repo.upsertAddOns({
					bookingId,
					perItemAddOns: [],
					perWorkspaceAddOns,
				});
			}
		}

		// Update totals
		await repo.updateTotals({
			bookingId,
			totalAmount,
		});
	}

	// Return updated booking
	return repo.findBookingById(bookingId);
}

/**
 * Submit booking for approval
 * Validates full booking data with strict schema
 * Sets status based on user verification state
 */
export async function submit(params: {
	userId: string;
	bookingId: string;
	userStatus: "active" | "pending" | "inactive" | "rejected" | "suspended";
}) {
	const { userId, bookingId, userStatus } = params;

	// Ensure ownership
	await repo.ensureOwner(bookingId, userId);

	// Ensure status is draft or revision_requested
	const booking = await repo.findBookingById(bookingId);
	if (
		!booking ||
		(booking.status !== "draft" && booking.status !== "revision_requested")
	) {
		throw new Error(
			"Booking is not submittable (must be in draft or revision_requested status)",
		);
	}

	// Partition items: exclude working_space from service items mapping
	const sampleItems = booking.serviceItems.filter(
		(si) => si.service.category !== "working_space",
	);

	// Load full booking and map to DTO for strict validation
	// Build DTO from database
	// Infer payer type from user profile when not stored in draft
	const inferredPayerType: BookingSubmitDto["payerType"] =
		booking.user.userType === "external_member"
			? "external"
			: booking.user.academicType === "staff"
				? "staff"
				: "student-self";

	const dto: BookingSubmitDto = {
		projectDescription: booking.projectDescription ?? "",
		preferredStartDate: booking.preferredStartDate ?? undefined,
		preferredEndDate: booking.preferredEndDate ?? undefined,
		notes: booking.notes ?? undefined,
		serviceItems: sampleItems.map((item) => ({
			serviceId: item.serviceId,
			quantity: item.quantity,
			// Sample items do not have a stored duration in the DB; set to
			sampleName: item.sampleName ?? undefined,
			sampleDetails: item.sampleDetails ?? undefined,
			sampleType: normalizeSampleType(item.sampleType),
			sampleHazard: item.sampleHazard ?? undefined,
			testingMethod: item.testingMethod ?? undefined,
			degasConditions: item.degasConditions ?? undefined,
			solventSystem: item.solventSystem ?? undefined,
			solvents: item.solvents ?? undefined,
			solventComposition: item.solventComposition ?? undefined,
			columnType: item.columnType ?? undefined,
			flowRate: item.flowRate?.toNumber() ?? undefined,
			wavelength: item.wavelength ?? undefined,
			expectedRetentionTime:
				item.expectedRetentionTime?.toNumber() ?? undefined,
			samplePreparation: item.samplePreparation ?? undefined,
			notes: item.notes ?? undefined,
			expectedCompletionDate: item.expectedCompletionDate ?? undefined,
			actualCompletionDate: item.actualCompletionDate ?? undefined,
			turnaroundEstimate: item.turnaroundEstimate ?? undefined,
			temperatureControlled: item.temperatureControlled,
			lightSensitive: item.lightSensitive,
			hazardousMaterial: item.hazardousMaterial,
			inertAtmosphere: item.inertAtmosphere,
			equipmentIds: item.equipmentUsages.map((eu) => eu.equipmentId),
			otherEquipmentRequests: normalizeOtherEquipmentRequests(
				item.otherEquipmentRequests,
			),
		})),
		workspaceBookings: booking.workspaceBookings.map((ws) => ({
			startDate: ws.startDate,
			endDate: ws.endDate,
			preferredTimeSlot: ws.preferredTimeSlot ?? undefined,
			equipmentIds: ws.equipmentUsages.map((eu) => eu.equipmentId),
			specialEquipment: normalizeSpecialEquipment(ws.specialEquipment),
			purpose: ws.purpose ?? undefined,
			notes: ws.notes ?? undefined,
		})),
		payerType: inferredPayerType,
		billingName: `${booking.user.firstName} ${booking.user.lastName}`,
		billingEmail: booking.user.email,
	};

	// Validate with strict schema
	const validationResult = bookingSubmitDto.safeParse(dto);
	if (!validationResult.success) {
		throw new BookingValidationError(validationResult.error.issues);
	}

	// Determine new status based on user verification state
	const newStatus =
		userStatus === "active" ? "pending_approval" : "pending_user_verification";

	// Update status
	await repo.setStatus({
		bookingId,
		status: newStatus,
		reviewNotes: null,
		reviewedBy: null,
		reviewedAt: null,
	});

	// Send notifications
	await notifications.notifyUserBookingSubmitted({
		userId,
		bookingId,
		referenceNumber: booking.referenceNumber,
		status: newStatus,
	});

	// Notify admins
	const admins = await repo.listAdmins();
	if (admins.length > 0) {
		await notifications.notifyAdminsNewBooking({
			adminIds: admins.map((a) => a.id),
			bookingId,
			referenceNumber: booking.referenceNumber,
			status: newStatus,
		});
	}

	return {
		bookingId,
		status: newStatus,
	};
}

export class BookingValidationError extends Error {
	constructor(public issues: ZodIssue[]) {
		super("Booking validation failed");
	}
}

/**
 * Admin: Return booking for edit
 * Changes status to draft and adds review notes
 * Not allowed from rejected status
 */
export async function adminReturnForEdit(params: {
	adminId: string;
	bookingId: string;
	note: string;
}) {
	const { adminId, bookingId, note } = params;

	// Load booking
	const booking = await repo.findBookingById(bookingId);
	if (!booking) {
		throw new Error("Booking not found");
	}

	// Check current status - disallow from rejected
	if (booking.status === "rejected") {
		throw new Error(
			"Cannot return rejected bookings for edit. Rejected bookings are immutable.",
		);
	}

	if (booking.status !== "pending_approval") {
		throw new Error(
			"Can only return bookings that are pending approval for edit",
		);
	}

	// Set status to draft with review notes
	await repo.setStatus({
		bookingId,
		status: "draft",
		reviewNotes: note,
		reviewedBy: adminId,
		reviewedAt: new Date(),
	});

	// Notify user
	await notifications.notifyUserBookingReturnedForEdit({
		userId: booking.userId,
		bookingId,
		referenceNumber: booking.referenceNumber,
		note,
	});
}

/**
 * Admin: Reject booking
 * Sets status to rejected (immutable thereafter)
 * Requires note
 */
export async function adminReject(params: {
	adminId: string;
	bookingId: string;
	note: string;
}) {
	const { adminId, bookingId, note } = params;

	if (!note || !note.trim()) {
		throw new Error("Rejection note is required");
	}

	// Load booking
	const booking = await repo.findBookingById(bookingId);
	if (!booking) {
		throw new Error("Booking not found");
	}

	// Check current status
	if (booking.status !== "pending_approval") {
		throw new Error("Can only reject bookings that are pending approval");
	}

	// Set status to rejected
	await repo.setStatus({
		bookingId,
		status: "rejected",
		reviewNotes: note,
		reviewedBy: adminId,
		reviewedAt: new Date(),
	});

	// Notify user
	await notifications.notifyUserBookingRejected({
		userId: booking.userId,
		bookingId,
		referenceNumber: booking.referenceNumber,
		note,
	});
}

/**
 * Admin: Approve booking
 */
export async function adminApprove(params: {
	adminId: string;
	bookingId: string;
}) {
	const { adminId, bookingId } = params;

	// Load booking
	const booking = await repo.findBookingById(bookingId);
	if (!booking) {
		throw new Error("Booking not found");
	}

	// Check current status
	if (booking.status !== "pending_approval") {
		throw new Error("Can only approve bookings that are pending approval");
	}

	// Set status to approved
	await repo.setStatus({
		bookingId,
		status: "approved",
		reviewNotes: null,
		reviewedBy: adminId,
		reviewedAt: new Date(),
	});

	// Notify user
	await notifications.notifyUserBookingApproved({
		userId: booking.userId,
		bookingId,
		referenceNumber: booking.referenceNumber,
	});
}

/**
 * Admin: Verify user and flip pending_user_verification bookings to pending_approval
 */
export async function onUserVerified(params: {
	adminId: string;
	userId: string;
}) {
	const { userId } = params;

	// Set user status to active
	await repo.updateUserStatus(userId, "active");

	// Find all bookings pending user verification
	const bookings = await repo.findUserPendingVerificationBookings(userId);

	// Flip them to pending_approval
	for (const booking of bookings) {
		await repo.setStatus({
			bookingId: booking.id,
			status: "pending_approval",
			reviewNotes: null,
			reviewedBy: null,
			reviewedAt: null,
		});
	}

	// Notify user
	if (bookings.length > 0 && bookings[0]) {
		const user = await repo.findBookingById(bookings[0].id);
		if (user) {
			await notifications.notifyUserAccountVerified({
				userId,
				userEmail: user.user.email,
			});
		}

		// Notify admins
		const admins = await repo.listAdmins();
		if (admins.length > 0) {
			await notifications.notifyAdminsUserVerified({
				adminIds: admins.map((a) => a.id),
				userId,
				userEmail: user?.user.email ?? "",
				bookingCount: bookings.length,
			});
		}
	}
}

/**
 * Delete draft booking
 */
export async function deleteDraft(params: {
	userId: string;
	bookingId: string;
}) {
	return repo.deleteDraft(params);
}

/**
 * Purge expired drafts (for cron job)
 */
export async function purgeExpiredDrafts(cutoff: Date) {
	return repo.deleteExpiredDrafts(cutoff);
}
