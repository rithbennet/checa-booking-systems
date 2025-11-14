import { Decimal } from "@prisma/client/runtime/library";
import { db } from "@/shared/server/db";
import { Prisma } from "../../../../generated/prisma";

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
        },
      },
      companyRelation: true,
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
    durationMonths: number;
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
            JSON.stringify(otherEquipmentRequests)
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
            JSON.stringify(specialEquipment)
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
 * Delete draft booking (only when status = draft)
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

  if (booking?.status !== "draft") {
    throw new Error("Can only delete draft bookings");
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
  effectiveDate = new Date()
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
  effectiveDate = new Date()
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
  status: "active" | "pending" | "inactive" | "rejected" | "suspended"
) {
  return db.user.update({
    where: { id: userId },
    data: { status },
  });
}
