/**
 * Domain factories and normalizers for booking entities
 * Pure functions with no store dependencies
 */

import type {
  BookingServiceItemInput,
  CreateBookingInput,
  WorkspaceBookingInput,
} from "@/entities/booking/model/schemas";
import type { Service } from "@/entities/service";

/**
 * Creates a default service item for a given service
 * @param service - The service to create an item for
 * @param now - Current timestamp (for testing/consistency)
 * @returns A default BookingServiceItemInput
 */
export function createDefaultServiceItem(
  service: Service,
  now = new Date()
): BookingServiceItemInput {
  const isWorkingSpace = service.category === "working_space";

  return {
    serviceId: service.id,
    quantity: isWorkingSpace ? 0 : 1,
    durationMonths: isWorkingSpace ? 1 : 0,
    temperatureControlled: false,
    lightSensitive: false,
    hazardousMaterial: false,
    inertAtmosphere: false,
    equipmentIds: [],
    otherEquipmentRequests: [],
    addOnIds: [],
    ...(isWorkingSpace
      ? {
          expectedCompletionDate: now,
          notes: `START_DATE:${now.toISOString()}||END_DATE:${new Date(
            now.getTime() + 30 * 24 * 60 * 60 * 1000
          ).toISOString()}`,
        }
      : {}),
  };
}

/**
 * Creates a default workspace booking
 * @param now - Current timestamp (for testing/consistency)
 * @returns A default WorkspaceBookingInput
 */
export function createDefaultWorkspaceBooking(
  now = new Date()
): WorkspaceBookingInput {
  return {
    startDate: now,
    endDate: now,
    equipmentIds: [],
    addOnIds: [],
  };
}

/**
 * Normalizes a service item to ensure all required fields have defaults
 * @param item - Partial service item
 * @param service - Optional service for category-aware defaults
 * @returns Normalized BookingServiceItemInput
 */
export function normalizeServiceItem(
  item: Partial<BookingServiceItemInput>,
  service?: Service
): BookingServiceItemInput {
  const isWorkingSpace = service?.category === "working_space";

  return {
    serviceId: item.serviceId ?? "",
    quantity: item.quantity ?? (isWorkingSpace ? 0 : 1),
    durationMonths: item.durationMonths ?? (isWorkingSpace ? 1 : 0),
    sampleName: item.sampleName,
    sampleDetails: item.sampleDetails,
    sampleType: item.sampleType,
    sampleHazard: item.sampleHazard,
    testingMethod: item.testingMethod,
    degasConditions: item.degasConditions,
    solventSystem: item.solventSystem,
    solvents: item.solvents,
    solventComposition: item.solventComposition,
    columnType: item.columnType,
    flowRate: item.flowRate,
    wavelength: item.wavelength,
    expectedRetentionTime: item.expectedRetentionTime,
    samplePreparation: item.samplePreparation,
    notes: item.notes,
    expectedCompletionDate: item.expectedCompletionDate,
    actualCompletionDate: item.actualCompletionDate,
    turnaroundEstimate: item.turnaroundEstimate,
    temperatureControlled: item.temperatureControlled ?? false,
    lightSensitive: item.lightSensitive ?? false,
    hazardousMaterial: item.hazardousMaterial ?? false,
    inertAtmosphere: item.inertAtmosphere ?? false,
    equipmentIds: item.equipmentIds ?? [],
    otherEquipmentRequests: item.otherEquipmentRequests ?? [],
    addOnIds: item.addOnIds ?? [],
    category: item.category,
  };
}

/**
 * Normalizes a workspace booking to ensure all required fields have defaults
 * @param workspace - Partial workspace booking
 * @returns Normalized WorkspaceBookingInput
 */
export function normalizeWorkspaceBooking(
  workspace: Partial<WorkspaceBookingInput>
): WorkspaceBookingInput {
  return {
    startDate: workspace.startDate ?? new Date(),
    endDate: workspace.endDate ?? new Date(),
    preferredTimeSlot: workspace.preferredTimeSlot,
    equipmentIds: workspace.equipmentIds ?? [],
    specialEquipment: workspace.specialEquipment ?? [],
    purpose: workspace.purpose,
    notes: workspace.notes,
    addOnIds: workspace.addOnIds ?? [],
  };
}

/**
 * Normalizes booking input to produce stable defaultValues for RHF
 * @param input - Partial booking input
 * @returns Normalized CreateBookingInput
 */
export function normalizeBookingInput(
  input: Partial<CreateBookingInput>
): CreateBookingInput {
  return {
    serviceItems: (input.serviceItems ?? []).map(
      (i: Partial<BookingServiceItemInput>) => normalizeServiceItem(i)
    ),
    workspaceBookings: (input.workspaceBookings ?? []).map(
      (w: Partial<WorkspaceBookingInput>) => normalizeWorkspaceBooking(w)
    ),
    projectDescription: input.projectDescription ?? "",
    additionalNotes: input.additionalNotes ?? "",
    payerType: input.payerType,
    billingName: input.billingName,
    billingAddressDisplay: input.billingAddressDisplay,
    billingPhone: input.billingPhone,
    billingEmail: input.billingEmail,
    utmCampus: input.utmCampus,
    preferredStartDate: input.preferredStartDate,
    preferredEndDate: input.preferredEndDate,
    notes: input.notes,
    status: input.status ?? "draft",
  };
}

/**
 * Attaches metadata (like service category) to service items for validation
 * This enriches the input with category information from the services map
 * @param input - The booking input to enrich
 * @param services - Array of available services
 * @returns Enriched CreateBookingInput with category metadata
 */
export function attachMetadataForValidation(
  input: CreateBookingInput,
  services: Service[]
): CreateBookingInput {
  const servicesMap = new Map(services.map((s) => [s.id, s]));

  return {
    ...input,
    serviceItems: input.serviceItems?.map((item: BookingServiceItemInput) => {
      const service = servicesMap.get(item.serviceId);
      return {
        ...item,
        category: service?.category,
      };
    }),
  };
}
