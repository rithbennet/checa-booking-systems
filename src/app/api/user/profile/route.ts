import { z } from "zod";
import { createCompanyBranch } from "@/entities/user/server/onboarding-options-repository";
import { updateProfileInputSchema } from "@/entities/user/model/schemas";
import {
	getUserProfile,
	updateUserProfile,
} from "@/entities/user/server/profile-repository";
import { createProtectedHandler } from "@/shared/lib/api-factory";
import { ValidationError } from "@/shared/server/errors";

/**
 * GET /api/user/profile
 * Returns the current user's profile data
 */
export const GET = createProtectedHandler(
	async (_req, user) => {
		const profile = await getUserProfile(user.id);

		if (!profile) {
			return Response.json({ error: "Profile not found" }, { status: 404 });
		}

		return profile;
	},
	{ requireActive: false }, // Allow pending users to see their profile
);

/**
 * Profile update validation schema for API route
 * Extends the base schema with route-specific fields for branch creation
 */
const updateProfileSchema = updateProfileInputSchema.extend({
	newBranchName: z.string().trim().optional(),
	newBranchAddress: z.string().trim().optional(),
});

/**
 * PATCH /api/user/profile
 * Updates the current user's profile data
 */
export const PATCH = createProtectedHandler(
	async (req, user) => {
		try {
			const body = await req.json();
			const result = updateProfileSchema.safeParse(body);

			if (!result.success) {
				return Response.json(
					{
						error: "Validation failed",
						details: result.error.flatten().fieldErrors,
					},
					{ status: 400 },
				);
			}

			const data = result.data;

			// Handle new branch creation for external users
			let finalBranchId = data.companyBranchId;
			if (data.companyId && !data.companyBranchId && data.newBranchName) {
				const newBranch = await createCompanyBranch({
					companyId: data.companyId,
					name: data.newBranchName,
					address: data.newBranchAddress,
				});
				finalBranchId = newBranch.id;
			}

			const profile = await updateUserProfile(user.id, {
				...data,
				companyBranchId: finalBranchId,
			});

			if (!profile) {
				return Response.json({ error: "Profile not found" }, { status: 404 });
			}

			return profile;
		} catch (error) {
			// Handle validation errors from repository layer (return 400)
			if (error instanceof ValidationError) {
				return Response.json(
					{
						error: error.error,
						...(error.details && { details: error.details }),
					},
					{ status: 400 },
				);
			}
			// Re-throw other errors to be handled by createProtectedHandler
			throw error;
		}
	},
	{ requireActive: false }, // Allow pending users to update their profile
);
