import { z } from "zod";
import {
	bookingServiceItemSchema,
	workspaceBookingSchema,
} from "../model/schemas";

/**
 * DTO for saving draft bookings (more permissive validation)
 * Used during the wizard flow where data may be incomplete
 */
export const bookingSaveDraftDto = z.object({
	step: z.number().int().min(1).max(5).optional(), // Current wizard step
	projectDescription: z.string().optional(),
	preferredStartDate: z.coerce.date().optional(),
	preferredEndDate: z.coerce.date().optional(),
	notes: z.string().optional(),
	additionalNotes: z.string().optional(),

	// Service items (lenient validation for drafts - any valid JSON object array)
	serviceItems: z.array(z.any()).optional(),

	// Workspace bookings (lenient validation for drafts - any valid JSON object array)
	workspaceBookings: z.array(z.any()).optional(),

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

export type BookingSaveDraftDto = z.infer<typeof bookingSaveDraftDto>;

/**
 * DTO for submitting bookings (strict validation)
 * All required fields must be present and valid
 */
export const bookingSubmitDto = z
	.object({
		projectDescription: z.string().min(1, "Project description is required"),
		preferredStartDate: z.coerce.date().optional(),
		preferredEndDate: z.coerce.date().optional(),
		notes: z.string().optional(),
		additionalNotes: z.string().optional(),

		// At least one service item or workspace booking required
		serviceItems: z.array(bookingServiceItemSchema).optional(),
		workspaceBookings: z.array(workspaceBookingSchema).optional(),

		// Billing & payer info - required on submit
		payerType: z.enum([
			"external",
			"staff",
			"student-self",
			"student-supervisor",
		]),
		billingName: z.string().min(1, "Billing name is required").max(200),
		billingAddressDisplay: z.string().optional().or(z.literal("")),
		billingPhone: z.string().max(30).optional(),
		billingEmail: z.string().email("Valid email is required"),
		utmCampus: z.enum(["kl", "johor_bahru"]).optional(),
	})
	.superRefine((data, ctx) => {
		const hasServiceItems = (data.serviceItems?.length ?? 0) > 0;
		const hasWorkspaceBookings = (data.workspaceBookings?.length ?? 0) > 0;

		if (!hasServiceItems && !hasWorkspaceBookings) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["serviceItems"],
				message:
					"At least one service item or workspace booking is required for submission",
			});
		}

		// Validate date range if both provided
		if (data.preferredStartDate && data.preferredEndDate) {
			if (data.preferredEndDate < data.preferredStartDate) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["preferredEndDate"],
					message: "End date must be after start date",
				});
			}
		}
	});

export type BookingSubmitDto = z.infer<typeof bookingSubmitDto>;

/**
 * DTO for admin actions
 */
export const adminReturnForEditDto = z.object({
	note: z.string().min(1, "Note is required when returning booking for edit"),
});

export const adminRejectDto = z.object({
	note: z.string().min(1, "Note is required when rejecting booking"),
});

export const adminApproveDto = z.object({
	// No additional fields needed, just bookingId from URL params
});

export type AdminReturnForEditDto = z.infer<typeof adminReturnForEditDto>;
export type AdminRejectDto = z.infer<typeof adminRejectDto>;
export type AdminApproveDto = z.infer<typeof adminApproveDto>;
