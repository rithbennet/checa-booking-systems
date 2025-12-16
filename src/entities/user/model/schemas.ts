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
