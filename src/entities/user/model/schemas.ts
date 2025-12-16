/**
 * User entity validation schemas
 *
 * Zod schemas for validating user-related data
 */

import { z } from "zod";

/**
 * Schema for validating profile update input
 */
export const updateProfileInputSchema = z.object({
	firstName: z.string().min(1, "First name cannot be empty").trim().optional(),
	lastName: z.string().min(1, "Last name cannot be empty").trim().optional(),
	phone: z.string().trim().nullable().optional(),
	userIdentifier: z.string().trim().optional(),
	supervisorName: z.string().trim().nullable().optional(),
	facultyId: z.string().uuid().nullable().optional(),
	departmentId: z.string().uuid().nullable().optional(),
	ikohzaId: z.string().uuid().nullable().optional(),
	companyId: z.string().uuid().nullable().optional(),
	companyBranchId: z.string().uuid().nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

/**
 * Schema for validating admin update user input
 * Extends base schema with userType and status fields
 */
export const adminUpdateUserInputSchema = updateProfileInputSchema
	.extend({
		userType: z
			.enum([
				"mjiit_member",
				"utm_member",
				"external_member",
				"lab_administrator",
			])
			.optional(),
		academicType: z.enum(["student", "staff", "none"]).optional(),
		status: z
			.enum(["pending", "active", "inactive", "rejected", "suspended"])
			.optional(),
	})
	.refine(
		(data) => {
			// UTM members cannot have ikohzaId
			if (
				data.userType === "utm_member" &&
				data.ikohzaId !== null &&
				data.ikohzaId !== undefined
			) {
				return false;
			}
			return true;
		},
		{
			message: "UTM members cannot have an iKohza",
			path: ["ikohzaId"],
		},
	);

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserInputSchema>;
