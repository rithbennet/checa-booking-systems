import { z } from "zod";

// Enums (align with Prisma, include "draft")
export const bookingStatusEnum = z.enum([
  "draft",
  "pending_user_verification",
  "pending_approval",
  "approved",
  "rejected",
  "in_progress",
  "completed",
  "cancelled",
]);

export const sampleTypeEnum = z.enum(["liquid", "solid", "powder", "solution"]);

export const paymentMethodEnum = z.enum([
  "eft",
  "vote_transfer",
  "local_order",
]);

// Sample schema for analysis services
export const sampleSchema = z.object({
  sampleName: z.string().min(1, "Sample name is required").max(200),
  sampleType: sampleTypeEnum.optional(),
  sampleDetails: z.string().optional(),
  sampleHazard: z.string().max(100).optional(),
  testingMethod: z.string().max(200).optional(),
  degasConditions: z.string().optional(),
  solventSystem: z.string().optional(),
  solvents: z.string().optional(),
  solventComposition: z.string().optional(),
  columnType: z.string().max(100).optional(),
  flowRate: z.number().positive().optional(),
  wavelength: z.number().int().positive().optional(),
  expectedRetentionTime: z.number().positive().optional(),
  samplePreparation: z.string().optional(),
  specialInstructions: z.string().optional(),
});

export type SampleInput = z.infer<typeof sampleSchema>;

// LabEquipment schema (for form input)
export const labEquipmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  isAvailable: z.boolean(),
});

export type LabEquipmentInput = z.infer<typeof labEquipmentSchema>;

// BookingServiceItem schema
export const bookingServiceItemSchema = z.object({
  serviceId: z.string().uuid(),
  quantity: z.number().int().positive(),
  durationMonths: z.number().int().nonnegative(),
  sampleName: z.string().max(200).optional(),
  sampleDetails: z.string().optional(),
  sampleType: sampleTypeEnum.optional(),
  sampleHazard: z.string().max(100).optional(),
  testingMethod: z.string().max(200).optional(),
  degasConditions: z.string().optional(),
  solventSystem: z.string().optional(),
  solvents: z.string().optional(),
  solventComposition: z.string().optional(),
  columnType: z.string().max(100).optional(),
  flowRate: z.number().positive().optional(),
  wavelength: z.number().int().positive().optional(),
  expectedRetentionTime: z.number().positive().optional(),
  samplePreparation: z.string().optional(),
  notes: z.string().optional(),
  // Timelines
  expectedCompletionDate: z.date().optional(),
  actualCompletionDate: z.date().optional(),
  turnaroundEstimate: z.string().max(100).optional(),
  // Special handling requirements - required with defaults
  temperatureControlled: z.boolean().default(false),
  lightSensitive: z.boolean().default(false),
  hazardousMaterial: z.boolean().default(false),
  inertAtmosphere: z.boolean().default(false),
  // Unified equipment system
  equipmentIds: z.array(z.string().uuid()).default([]),
  otherEquipmentRequests: z.array(z.string()).optional(),
  // Add-ons
  addOnIds: z.array(z.string().uuid()).optional(),
});

export type BookingServiceItemInput = z.infer<typeof bookingServiceItemSchema>;

// WorkspaceBooking schema
export const workspaceBookingSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  preferredTimeSlot: z.string().max(50).optional(),
  equipmentIds: z.array(z.string().uuid()).default([]),
  specialEquipment: z.array(z.string()).optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  addOnIds: z.array(z.string().uuid()).optional(),
});

export type WorkspaceBookingInput = z.infer<typeof workspaceBookingSchema>;

// 1) Base object (no effects). Keep this a pure ZodObject so we can omit/pick.
const bookingRequestBaseSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(), // set by server/session
  referenceNumber: z.string().max(50).optional(), // server generated
  projectDescription: z.string().optional(),
  preferredStartDate: z.date().optional(),
  preferredEndDate: z.date().optional(),
  totalAmount: z.number().nonnegative().default(0),
  status: bookingStatusEnum.default("draft"),
  notes: z.string().optional(),
  serviceItems: z.array(bookingServiceItemSchema).optional(),
  workspaceBookings: z.array(workspaceBookingSchema).optional(),
  additionalNotes: z.string().optional(),
  // Billing & payer info
  payerType: z
    .enum(["external", "staff", "student-self", "student-supervisor"])
    .optional(),
  billingName: z.string().max(200).optional(),
  billingAddressDisplay: z.string().max(300).optional(),
  billingPhone: z.string().max(30).optional(),
  billingEmail: z.string().email().optional(),
  utmCampus: z.enum(["kl", "johor_bahru"]).optional(),
});

// 2) Helper to attach final-only validation rules after structural derivations
const withFinalOnlyRules = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((data: any, ctx) => {
    const hasServiceItems = (data.serviceItems?.length ?? 0) > 0;
    const hasWorkspaceBookings = (data.workspaceBookings?.length ?? 0) > 0;

    if (data.status !== "draft") {
      if (!hasServiceItems && !hasWorkspaceBookings) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["serviceItems"],
          message: "At least one service item or workspace booking is required",
        });
      }
    }
  });

// 3) Canonical schema (effects applied)
export const bookingRequestSchema = withFinalOnlyRules(
  bookingRequestBaseSchema
);

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;

// 4) Create booking input schema derived from base, then apply the same rule
export const createBookingInputSchema = withFinalOnlyRules(
  bookingRequestBaseSchema.omit({
    id: true,
    userId: true,
    referenceNumber: true,
    totalAmount: true, // computed server-side
  })
);

export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;

// 5) Update booking input schema derived from base, then apply the same rule
export const updateBookingInputSchema = withFinalOnlyRules(
  bookingRequestBaseSchema
    .omit({
      userId: true,
      referenceNumber: true,
      totalAmount: true,
    })
    .extend({
      id: z.string().uuid(),
    })
);

export type UpdateBookingInput = z.infer<typeof updateBookingInputSchema>;

// Optional: server-only draft save parser (kept consistent)
export const saveDraftSchema = bookingRequestBaseSchema.extend({
  id: z.string().uuid().optional(),
  status: bookingStatusEnum.default("draft"),
});

export type SaveDraftInput = z.infer<typeof saveDraftSchema>;
