import { Decimal } from "@prisma/client/runtime/library";
import { db } from "@/shared/server/db";
import { type $Enums, Prisma } from "../../../../generated/prisma";

/**
 * Repository for booking-related database operations
 * Encapsulates all Prisma queries for the booking domain
 */

/**
 * Generate new reference number for booking
 * Using timestamp-based approach for simplicity
 */
export function newReferenceNumber(): string {
	const timestamp = Date.now().toString(36).toUpperCase();
	const random = Math.random().toString(36).substring(2, 6).toUpperCase();
	return `BK-${timestamp}-${random}`;
}

/**
 * Find a booking by ID with all related data
 */
export async function findBookingById(bookingId: string) {
	return db.bookingRequest.findUnique({
		where: { id: bookingId },
		include: {
			serviceItems: {
				include: {
					service: true,
					serviceAddOns: true,
					equipmentUsages: {
						include: {
							equipment: true,
						},
					},
				},
			},
			workspaceBookings: {
				include: {
					serviceAddOns: true,
					equipmentUsages: {
						include: {
							equipment: true,
						},
					},
				},
			},
			user: {
				select: {
					id: true,
					email: true,
					firstName: true,
					lastName: true,
					userType: true,
					status: true,
					academicType: true,
				},
			},
			company: true,
			companyBranch: true,
		},
	});
}

/**
 * Ensure user owns the booking
 * Throws error if not owner
 */
export async function ensureOwner(bookingId: string, userId: string) {
	const booking = await db.bookingRequest.findUnique({
		where: { id: bookingId },
		select: { userId: true },
	});

	if (!booking) {
		throw new Error("Booking not found");
	}

	if (booking.userId !== userId) {
		throw new Error("Forbidden: You do not own this booking");
	}
}

/**
 * Create a draft booking
 */
export async function createDraft(params: {
	userId: string;
	referenceNumber: string;
}) {
	const { userId, referenceNumber } = params;

	// Get user's company info if external member
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { companyId: true, companyBranchId: true },
	});

	return db.bookingRequest.create({
		data: {
			userId,
			referenceNumber,
			status: "draft",
			totalAmount: new Decimal(0),
			companyId: user?.companyId,
			companyBranchId: user?.companyBranchId,
		},
	});
}

/**
 * Update draft metadata (step, description, dates, notes)
 */
export async function updateDraft(params: {
	bookingId: string;
	step?: number;
	projectDescription?: string;
	preferredStartDate?: Date;
	preferredEndDate?: Date;
	notes?: string;
}) {
	const { bookingId, ...data } = params;

	return db.bookingRequest.update({
		where: { id: bookingId },
		data,
	});
}

/**
 * Upsert service items for a booking
 * Deletes items not in the new list
 * Does NOT handle add-ons - use upsertAddOns separately
 */
export async function upsertServiceItems(params: {
	bookingId: string;
	items: Array<{
		id?: string;
		serviceId: string;
		quantity: number;
		unitPrice: Decimal;
		totalPrice: Decimal;
		sampleName?: string;
		sampleDetails?: string;
		sampleType?: string;
		sampleHazard?: string;
		testingMethod?: string;
		degasConditions?: string;
		solventSystem?: string;
		solvents?: string;
		solventComposition?: string;
		columnType?: string;
		flowRate?: Decimal;
		wavelength?: number;
		expectedRetentionTime?: Decimal;
		samplePreparation?: string;
		notes?: string;
		expectedCompletionDate?: Date;
		actualCompletionDate?: Date;
		turnaroundEstimate?: string;
		temperatureControlled: boolean;
		lightSensitive: boolean;
		hazardousMaterial: boolean;
		inertAtmosphere: boolean;
		equipmentIds: string[];
		otherEquipmentRequests?: string[] | null;
		// addOnCatalogIds handled separately by upsertAddOns
	}>;
}) {
	const { bookingId, items } = params;

	// Get existing item IDs
	const existing = await db.bookingServiceItem.findMany({
		where: { bookingRequestId: bookingId },
		select: { id: true },
	});

	const existingIds = new Set(existing.map((i) => i.id));
	const newIds = new Set(items.filter((i) => i.id).map((i) => i.id as string));

	// Delete removed items
	const toDelete = [...existingIds].filter((id) => !newIds.has(id));
	if (toDelete.length > 0) {
		await db.bookingServiceItem.deleteMany({
			where: { id: { in: toDelete } },
		});
	}

	// Upsert items
	const results = [];
	for (const item of items) {
		const { id, equipmentIds, otherEquipmentRequests, ...itemData } = item;

		// Never pass add-on arrays to Prisma (handled separately via upsertAddOns)
		const itemDataAny = itemData as Record<string, unknown>;
		if ("addOnCatalogIds" in itemDataAny) {
			delete (itemDataAny as { [k: string]: unknown }).addOnCatalogIds;
		}

		// Convert otherEquipmentRequests to proper JSON or undefined
		const otherEquipmentJson:
			| Prisma.InputJsonValue
			| undefined
			| Prisma.NullableJsonNullValueInput =
			otherEquipmentRequests && otherEquipmentRequests.length > 0
				? (JSON.parse(
						JSON.stringify(otherEquipmentRequests),
					) as Prisma.InputJsonValue)
				: Prisma.JsonNull;

		type SavedItem = Awaited<ReturnType<typeof db.bookingServiceItem.create>>;
		let savedItem: SavedItem;
		if (id) {
			// Update existing
			savedItem = await db.bookingServiceItem.update({
				where: { id },
				data: {
					...(itemDataAny as typeof itemData),
					otherEquipmentRequests: otherEquipmentJson,
				},
			});

			// Update equipment usages
			await db.sampleEquipmentUsage.deleteMany({
				where: { bookingServiceItemId: id },
			});
		} else {
			// Create new
			savedItem = await db.bookingServiceItem.create({
				data: {
					...(itemDataAny as typeof itemData),
					bookingRequestId: bookingId,
					otherEquipmentRequests: otherEquipmentJson,
				},
			});
		}

		// Create equipment usages
		if (equipmentIds.length > 0) {
			await db.sampleEquipmentUsage.createMany({
				data: equipmentIds.map((equipmentId) => ({
					bookingServiceItemId: savedItem.id,
					equipmentId,
				})),
			});
		}

		results.push(savedItem);
	}

	return results;
}

/**
 * Upsert workspace bookings for a booking
 * Does NOT handle add-ons - use upsertAddOns separately
 */
export async function upsertWorkspaceBookings(params: {
	bookingId: string;
	items: Array<{
		id?: string;
		startDate: Date;
		endDate: Date;
		preferredTimeSlot?: string;
		equipmentIds: string[];
		specialEquipment?: string[] | null;
		purpose?: string;
		notes?: string;
		// addOnCatalogIds handled separately by upsertAddOns
	}>;
}) {
	const { bookingId, items } = params;

	// Get existing workspace booking IDs
	const existing = await db.workspaceBooking.findMany({
		where: { bookingRequestId: bookingId },
		select: { id: true },
	});

	const existingIds = new Set(existing.map((i) => i.id));
	const newIds = new Set(items.filter((i) => i.id).map((i) => i.id as string));

	// Delete removed bookings
	const toDelete = [...existingIds].filter((id) => !newIds.has(id));
	if (toDelete.length > 0) {
		await db.workspaceBooking.deleteMany({
			where: { id: { in: toDelete } },
		});
	}

	// Upsert workspace bookings
	const results = [];
	for (const item of items) {
		const { id, equipmentIds, specialEquipment, ...itemData } = item;

		// Never pass add-on arrays to Prisma (handled separately via upsertAddOns)
		const wsItemDataAny = itemData as Record<string, unknown>;
		if ("addOnCatalogIds" in wsItemDataAny) {
			delete (wsItemDataAny as { [k: string]: unknown }).addOnCatalogIds;
		}

		// Convert specialEquipment to proper JSON or undefined
		const specialEquipmentJson:
			| Prisma.InputJsonValue
			| undefined
			| Prisma.NullableJsonNullValueInput =
			specialEquipment && specialEquipment.length > 0
				? (JSON.parse(
						JSON.stringify(specialEquipment),
					) as Prisma.InputJsonValue)
				: Prisma.JsonNull;

		type SavedItem = Awaited<ReturnType<typeof db.workspaceBooking.create>>;
		let savedItem: SavedItem;
		if (id) {
			// Update existing
			savedItem = await db.workspaceBooking.update({
				where: { id },
				data: {
					...(wsItemDataAny as typeof itemData),
					specialEquipment: specialEquipmentJson,
				},
			});

			// Update equipment usages
			await db.workspaceEquipmentUsage.deleteMany({
				where: { workspaceBookingId: id },
			});
		} else {
			// Create new
			savedItem = await db.workspaceBooking.create({
				data: {
					...(wsItemDataAny as typeof itemData),
					bookingRequestId: bookingId,
					specialEquipment: specialEquipmentJson,
				},
			});
		}

		// Create equipment usages
		if (equipmentIds.length > 0) {
			await db.workspaceEquipmentUsage.createMany({
				data: equipmentIds.map((equipmentId) => ({
					workspaceBookingId: savedItem.id,
					equipmentId,
				})),
			});
		}

		results.push(savedItem);
	}

	return results;
}

/**
 * Upsert add-ons for service items and workspace bookings
 * Resolves amounts from ServiceAddOnMapping (if exists) or GlobalAddOnCatalog defaults
 */
export async function upsertAddOns(params: {
	bookingId: string;
	perItemAddOns: Array<{
		bookingServiceItemId: string;
		serviceId: string;
		addOnCatalogIds: string[];
	}>;
	perWorkspaceAddOns: Array<{
		workspaceBookingId: string;
		addOnCatalogIds: string[];
	}>;
}) {
	const { perItemAddOns, perWorkspaceAddOns } = params;

	// Delete all existing add-ons for this booking's items and workspaces
	const itemIds = perItemAddOns.map((p) => p.bookingServiceItemId);
	const workspaceIds = perWorkspaceAddOns.map((p) => p.workspaceBookingId);

	if (itemIds.length > 0) {
		await db.serviceAddOn.deleteMany({
			where: { bookingServiceItemId: { in: itemIds } },
		});
	}

	if (workspaceIds.length > 0) {
		await db.serviceAddOn.deleteMany({
			where: { workspaceBookingId: { in: workspaceIds } },
		});
	}

	// Fetch add-on catalog data
	const allAddOnIds = [
		...perItemAddOns.flatMap((p) => p.addOnCatalogIds),
		...perWorkspaceAddOns.flatMap((p) => p.addOnCatalogIds),
	];
	const uniqueAddOnIds = [...new Set(allAddOnIds)];

	if (uniqueAddOnIds.length === 0) {
		return; // Nothing to create
	}

	const addOns = await db.globalAddOnCatalog.findMany({
		where: { id: { in: uniqueAddOnIds }, isActive: true },
	});

	const addOnMap = new Map(addOns.map((a) => [a.id, a]));

	// Fetch all service mappings for items
	const serviceIds = [...new Set(perItemAddOns.map((p) => p.serviceId))];
	const mappings = await db.serviceAddOnMapping.findMany({
		where: {
			serviceId: { in: serviceIds },
			addOnId: { in: uniqueAddOnIds },
			isEnabled: true,
		},
	});

	// Build mapping lookup: serviceId -> addOnId -> mapping
	const mappingLookup = new Map<
		string,
		Map<string, { customAmount: Prisma.Decimal | null }>
	>();
	for (const mapping of mappings) {
		if (!mappingLookup.has(mapping.serviceId)) {
			mappingLookup.set(mapping.serviceId, new Map());
		}
		mappingLookup.get(mapping.serviceId)?.set(mapping.addOnId, {
			customAmount: mapping.customAmount,
		});
	}

	// Create new add-ons for service items with resolved amounts
	for (const item of perItemAddOns) {
		const serviceMappings = mappingLookup.get(item.serviceId);

		for (const addOnCatalogId of item.addOnCatalogIds) {
			const addOn = addOnMap.get(addOnCatalogId);
			if (!addOn) continue;

			// Resolve amount: use service mapping if exists and has customAmount, else default
			const serviceMapping = serviceMappings?.get(addOnCatalogId);
			const amount = serviceMapping?.customAmount ?? addOn.defaultAmount;

			await db.serviceAddOn.create({
				data: {
					bookingServiceItemId: item.bookingServiceItemId,
					addOnCatalogId,
					name: addOn.name,
					amount,
					taxable: true,
					description: addOn.description,
				},
			});
		}
	}

	// Create new add-ons for workspace bookings (use defaults, no service-specific overrides)
	for (const workspace of perWorkspaceAddOns) {
		for (const addOnCatalogId of workspace.addOnCatalogIds) {
			const addOn = addOnMap.get(addOnCatalogId);
			if (!addOn) continue;

			await db.serviceAddOn.create({
				data: {
					workspaceBookingId: workspace.workspaceBookingId,
					addOnCatalogId,
					name: addOn.name,
					amount: addOn.defaultAmount,
					taxable: true,
					description: addOn.description,
				},
			});
		}
	}
}

/**
 * Update booking total amount
 */
export async function updateTotals(params: {
	bookingId: string;
	totalAmount: Decimal;
}) {
	return db.bookingRequest.update({
		where: { id: params.bookingId },
		data: { totalAmount: params.totalAmount },
	});
}

/**
 * Set booking status
 */
export async function setStatus(params: {
	bookingId: string;
	status: Prisma.BookingRequestUpdateInput["status"];
	reviewNotes?: string | null;
	reviewedBy?: string | null;
	reviewedAt?: Date | null;
}) {
	return db.bookingRequest.update({
		where: { id: params.bookingId },
		data: {
			status: params.status,
			reviewNotes: params.reviewNotes,
			reviewedBy: params.reviewedBy,
			reviewedAt: params.reviewedAt,
		},
	});
}

/**
 * Delete draft booking (only when status = draft or revision_requested)
 */
export async function deleteDraft(params: {
	bookingId: string;
	userId: string;
}) {
	await ensureOwner(params.bookingId, params.userId);

	const booking = await db.bookingRequest.findUnique({
		where: { id: params.bookingId },
		select: { status: true },
	});

	if (booking?.status !== "draft" && booking?.status !== "revision_requested") {
		throw new Error("Can only delete draft or revision_requested bookings");
	}

	return db.bookingRequest.delete({
		where: { id: params.bookingId },
	});
}

/**
 * Delete expired draft bookings
 */
export async function deleteExpiredDrafts(cutoff: Date) {
	const result = await db.bookingRequest.deleteMany({
		where: {
			status: "draft",
			createdAt: {
				lt: cutoff,
			},
		},
	});

	return result.count;
}

/**
 * List admin users for notifications
 */
export async function listAdmins() {
	return db.user.findMany({
		where: {
			userType: "lab_administrator",
			status: "active",
		},
		select: {
			id: true,
			email: true,
			firstName: true,
			lastName: true,
		},
	});
}

/**
 * Get service pricing for a user type
 */
export async function getServicePricing(
	serviceId: string,
	userType: string,
	effectiveDate = new Date(),
) {
	return db.servicePricing.findFirst({
		where: {
			serviceId,
			userType: userType as
				| "mjiit_member"
				| "utm_member"
				| "external_member"
				| "lab_administrator",
			effectiveFrom: {
				lte: effectiveDate,
			},
			OR: [{ effectiveTo: null }, { effectiveTo: { gte: effectiveDate } }],
		},
		orderBy: {
			effectiveFrom: "desc",
		},
	});
}

/**
 * Get multiple service pricings at once
 */
export async function getServicePricings(
	serviceIds: string[],
	userType: string,
	effectiveDate = new Date(),
) {
	const pricings = await db.servicePricing.findMany({
		where: {
			serviceId: { in: serviceIds },
			userType: userType as
				| "mjiit_member"
				| "utm_member"
				| "external_member"
				| "lab_administrator",
			effectiveFrom: {
				lte: effectiveDate,
			},
			OR: [{ effectiveTo: null }, { effectiveTo: { gte: effectiveDate } }],
		},
		orderBy: {
			effectiveFrom: "desc",
		},
	});

	// Return the most recent pricing for each service
	const map = new Map();
	for (const pricing of pricings) {
		if (!map.has(pricing.serviceId)) {
			map.set(pricing.serviceId, pricing);
		}
	}

	return map;
}

/**
 * Get add-on catalog items by IDs
 */
export async function getAddOnsByIds(addOnIds: string[]) {
	const addOns = await db.globalAddOnCatalog.findMany({
		where: {
			id: { in: addOnIds },
			isActive: true,
		},
	});

	return new Map(addOns.map((a) => [a.id, a]));
}

/**
 * Find the Working Space service (category = "working_space")
 */
export async function getWorkingSpaceService() {
	return db.service.findFirst({
		where: { category: "working_space" },
		select: { id: true },
	});
}

/**
 * Find bookings pending user verification for a specific user
 */
export async function findUserPendingVerificationBookings(userId: string) {
	return db.bookingRequest.findMany({
		where: {
			userId,
			status: "pending_user_verification",
		},
	});
}

/**
 * Update user status
 */
export async function updateUserStatus(
	userId: string,
	status: "active" | "pending" | "inactive" | "rejected" | "suspended",
) {
	return db.user.update({
		where: { id: userId },
		data: { status },
	});
}

/* -------------------------------------------------------------------------- */
/* User bookings listing with pagination and filters                          */
/* -------------------------------------------------------------------------- */

export type ListUserBookingsParams = {
	userId: string;
	page: number;
	pageSize: number;
	q?: string;
	sort?:
		| "updated_at:desc"
		| "updated_at:asc"
		| "created_at:desc"
		| "created_at:asc"
		| "status:asc"
		| "amount:desc"
		| "amount:asc";
	status?: string[];
	createdFrom?: Date;
	createdTo?: Date;
	type?: "all" | "analysis_only" | "working_space";
};

export async function listUserBookings(params: ListUserBookingsParams) {
	const {
		userId,
		page,
		pageSize,
		q,
		sort = "updated_at:desc",
		status,
		createdFrom,
		createdTo,
		type = "all",
	} = params;

	const where: Prisma.BookingRequestWhereInput = {
		userId,
		...(q
			? {
					OR: [
						{ referenceNumber: { contains: q, mode: "insensitive" } },
						{ projectDescription: { contains: q, mode: "insensitive" } },
					],
				}
			: {}),
		...(status && status.length > 0
			? { status: { in: status as unknown as $Enums.booking_status_enum[] } }
			: {}),
		...(createdFrom || createdTo
			? {
					createdAt: {
						...(createdFrom ? { gte: createdFrom } : {}),
						...(createdTo ? { lte: createdTo } : {}),
					},
				}
			: {}),
		...(type === "working_space"
			? {
					OR: [
						{ workspaceBookings: { some: {} } },
						// Fallback: if workspace bookings weren't created yet, detect via service category
						{
							serviceItems: {
								some: {
									service: { category: "working_space" },
								},
							},
						},
					],
				}
			: {}),
		...(type === "analysis_only"
			? {
					AND: [
						// Must have at least one analysis service item
						{ serviceItems: { some: {} } },
						// And no workspace bookings
						{ workspaceBookings: { none: {} } },
					],
				}
			: {}),
	};

	const orderBy: Prisma.BookingRequestOrderByWithRelationInput =
		sort === "updated_at:asc"
			? { updatedAt: "asc" }
			: sort === "updated_at:desc"
				? { updatedAt: "desc" }
				: sort === "created_at:asc"
					? { createdAt: "asc" }
					: sort === "created_at:desc"
						? { createdAt: "desc" }
						: sort === "status:asc"
							? { status: "asc" }
							: sort === "amount:asc"
								? { totalAmount: "asc" }
								: { totalAmount: "desc" };

	const [rows, total] = await Promise.all([
		db.bookingRequest.findMany({
			where,
			orderBy,
			skip: (page - 1) * pageSize,
			take: pageSize,
			select: {
				id: true,
				referenceNumber: true,
				projectDescription: true,
				status: true,
				totalAmount: true,
				reviewNotes: true,
				createdAt: true,
				updatedAt: true,
				_count: {
					select: { workspaceBookings: true },
				},
			},
		}),
		db.bookingRequest.count({ where }),
	]);

	const items = rows.map((r) => ({
		id: r.id,
		reference: r.referenceNumber,
		projectTitle: r.projectDescription ?? "",
		status: r.status,
		totalAmount: (r.totalAmount as unknown as Decimal).toNumber?.()
			? (r.totalAmount as unknown as Decimal).toNumber()
			: // in case Prisma returns number already
				(r.totalAmount as unknown as number),
		currency: "MYR",
		createdAt: r.createdAt,
		updatedAt: r.updatedAt,
		reviewNotes: r.reviewNotes,
		flags: {
			hasWorkingSpace: r._count.workspaceBookings > 0,
			hasUnread: false,
			hasOverdueInvoice: false,
		},
		nextRequiredAction:
			r.status === "draft"
				? "complete_draft"
				: r.status === "pending_user_verification"
					? "complete_verification"
					: undefined,
	}));

	return { items, total };
}

export async function countUserBookingsByStatus(params: {
	userId: string;
	status?: string[];
	createdFrom?: Date;
	createdTo?: Date;
	type?: "all" | "analysis_only" | "working_space";
}) {
	const { userId, status, createdFrom, createdTo, type = "all" } = params;

	const where: Prisma.BookingRequestWhereInput = {
		userId,
		...(status && status.length > 0
			? { status: { in: status as unknown as $Enums.booking_status_enum[] } }
			: {}),
		...(createdFrom || createdTo
			? {
					createdAt: {
						...(createdFrom ? { gte: createdFrom } : {}),
						...(createdTo ? { lte: createdTo } : {}),
					},
				}
			: {}),
		...(type === "working_space"
			? {
					OR: [
						{ workspaceBookings: { some: {} } },
						{
							serviceItems: {
								some: { service: { category: "working_space" } },
							},
						},
					],
				}
			: {}),
		...(type === "analysis_only"
			? {
					AND: [
						{ serviceItems: { some: {} } },
						{ workspaceBookings: { none: {} } },
					],
				}
			: {}),
	};

	// Single grouped query; no OFFSET/LIMIT applied
	const grouped = await db.bookingRequest.groupBy({
		by: ["status"],
		where,
		_count: { _all: true },
	});

	const initial: Record<$Enums.booking_status_enum, number> = {
		draft: 0,
		pending_user_verification: 0,
		pending_approval: 0,
		approved: 0,
		rejected: 0,
		in_progress: 0,
		completed: 0,
		cancelled: 0,
		revision_requested: 0,
	};

	for (const row of grouped) {
		const key = row.status as keyof typeof initial;
		initial[key] = row._count._all;
	}

	const all = Object.values(initial).reduce((a, b) => a + b, 0);

	return {
		all,
		draft: initial.draft,
		pending_user_verification: initial.pending_user_verification,
		pending_approval: initial.pending_approval,
		revision_requested: initial.revision_requested,
		approved: initial.approved,
		rejected: initial.rejected,
		in_progress: initial.in_progress,
		completed: initial.completed,
		cancelled: initial.cancelled,
	};
}

/**
 * Find workspace bookings for a user with specific booking request statuses
 * Used for conflict detection during booking submission
 */
export async function findUserWorkspaceBookings(params: {
	userId: string;
	excludeBookingId?: string;
	statuses: Array<"pending_approval" | "approved" | "in_progress">;
}) {
	const { userId, excludeBookingId, statuses } = params;

	const where: Prisma.WorkspaceBookingWhereInput = {
		bookingRequest: {
			userId,
			status: {
				in: statuses as unknown as $Enums.booking_status_enum[],
			},
			...(excludeBookingId
				? {
						id: {
							not: excludeBookingId,
						},
					}
				: {}),
		},
	};

	return db.workspaceBooking.findMany({
		where,
		select: {
			id: true,
			startDate: true,
			endDate: true,
			bookingRequestId: true,
		},
	});
}
