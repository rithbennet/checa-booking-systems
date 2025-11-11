/**
 * Zod schemas for booking validation
 * Generated from Prisma schema types
 */

import { z } from "zod";

// Enums
export const bookingStatusEnum = z.enum([
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
	equipmentIds: z.array(z.string().uuid()).default([]), // For form input
	otherEquipmentRequests: z.array(z.string()).optional(), // Array of custom equipment names
	// Add-ons
	addOnIds: z.array(z.string().uuid()).optional(), // Selected add-on catalog IDs
});

// WorkspaceBooking schema
export const workspaceBookingSchema = z.object({
	startDate: z.date(),
	endDate: z.date(),
	preferredTimeSlot: z.string().max(50).optional(),
	equipmentIds: z.array(z.string().uuid()).default([]), // For form input
	specialEquipment: z.array(z.string()).optional(), // Array of custom equipment names
	purpose: z.string().optional(),
	notes: z.string().optional(),
	// Add-ons
	addOnIds: z.array(z.string().uuid()).optional(), // Selected add-on catalog IDs
});

export type WorkspaceBookingInput = z.infer<typeof workspaceBookingSchema>;

// BookingRequest base schema (without refine)
const bookingRequestBaseSchema = z.object({
	id: z.string().uuid().optional(),
	userId: z.string().uuid().optional(), // Will be set from session
	referenceNumber: z.string().max(50).optional(), // Auto-generated
	projectDescription: z.string().optional(),
	preferredStartDate: z.date().optional(),
	preferredEndDate: z.date().optional(),
	totalAmount: z.number().nonnegative().default(0),
	status: bookingStatusEnum.default("pending_user_verification"),
	notes: z.string().optional(),
	serviceItems: z.array(bookingServiceItemSchema).optional(),
	workspaceBookings: z.array(workspaceBookingSchema).optional(),
	additionalNotes: z.string().optional(),
});

// BookingRequest schema with validation
export const bookingRequestSchema = bookingRequestBaseSchema.refine(
	(data) => {
		const hasServiceItems = data.serviceItems && data.serviceItems.length > 0;
		const hasWorkspaceBookings =
			data.workspaceBookings && data.workspaceBookings.length > 0;
		return hasServiceItems || hasWorkspaceBookings;
	},
	{
		message: "At least one service item or workspace booking is required",
	},
);

// Draft booking schema (more lenient)
export const draftBookingSchema = bookingRequestBaseSchema.partial().extend({
	serviceItems: z.array(bookingServiceItemSchema.partial()).optional(),
});

// Create booking input schema (for API)
export const createBookingInputSchema = bookingRequestBaseSchema
	.omit({
		id: true,
		userId: true,
		referenceNumber: true,
		status: true,
		totalAmount: true,
	})
	.refine(
		(data) => {
			const hasServiceItems = data.serviceItems && data.serviceItems.length > 0;
			const hasWorkspaceBookings =
				data.workspaceBookings && data.workspaceBookings.length > 0;
			return hasServiceItems || hasWorkspaceBookings;
		},
		{
			message: "At least one service item or workspace booking is required",
		},
	);

// Update booking input schema
export const updateBookingInputSchema = bookingRequestBaseSchema
	.partial()
	.extend({
		id: z.string().uuid(),
	});

// Save draft schema
export const saveDraftSchema = draftBookingSchema.extend({
	id: z.string().uuid().optional(),
});

export type BookingServiceItemInput = z.infer<typeof bookingServiceItemSchema>;
export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;
export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingInputSchema>;
export type DraftBookingInput = z.infer<typeof draftBookingSchema>;
export type SaveDraftInput = z.infer<typeof saveDraftSchema>;
