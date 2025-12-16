import { syncGoogleProfileImage } from "@/entities/user/server";
import { createProtectedHandler } from "@/shared/lib/api-factory";

/**
 * POST /api/user/sync-profile-image
 * Syncs Google profile image from BetterAuth to User.profileImageUrl
 * Only updates if profileImageUrl is currently NULL
 */
export const POST = createProtectedHandler(
	async (_req, _user, ctx) => {
		try {
			const authUserId = (ctx as { authUserId?: string })?.authUserId;
			if (!authUserId) {
				return Response.json({ error: "Invalid session" }, { status: 401 });
			}

			const synced = await syncGoogleProfileImage(authUserId);

			return Response.json({
				success: true,
				synced,
				message: synced
					? "Profile image synced from Google"
					: "No image to sync or image already set",
			});
		} catch (error) {
			console.error("Error syncing profile image:", error);
			return Response.json(
				{ error: "Failed to sync profile image" },
				{ status: 500 },
			);
		}
	},
	{ requireActive: false }, // Allow pending users to sync their image
);
