import { getUserProfile } from "@/entities/user/server/profile-repository";
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
