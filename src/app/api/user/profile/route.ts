import { z } from "zod";
import { createCompanyBranch } from "@/entities/user/server/onboarding-options-repository";
import {
	getUserProfile,
	updateUserProfile,
} from "@/entities/user/server/profile-repository";
import { createProtectedHandler } from "@/shared/lib/api-factory";

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
 * Profile update validation schema
 */
const updateProfileSchema = z.object({
	firstName: z.string().min(1, "First name is required").trim().optional(),
	lastName: z.string().min(1, "Last name is required").trim().optional(),
	phone: z.string().trim().nullable().optional(),
	userIdentifier: z.string().trim().optional(),
	supervisorName: z.string().trim().nullable().optional(),
	facultyId: z.string().uuid().nullable().optional(),
	departmentId: z.string().uuid().nullable().optional(),
	ikohzaId: z.string().uuid().nullable().optional(),
	companyId: z.string().uuid().nullable().optional(),
	companyBranchId: z.string().uuid().nullable().optional(),
	newBranchName: z.string().trim().optional(),
	newBranchAddress: z.string().trim().optional(),
});

/**
 * PATCH /api/user/profile
 * Updates the current user's profile data
 */
export const PATCH = createProtectedHandler(
	async (req, user) => {
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
	},
	{ requireActive: false }, // Allow pending users to update their profile
);
