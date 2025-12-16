import { NextResponse } from "next/server";
import { syncGoogleProfileImage } from "@/entities/user/server";
import { getSession } from "@/shared/server/better-auth/server";
import { createProtectedHandler } from "@/shared/lib/api-factory";

/**
 * POST /api/user/sync-profile-image
 * Syncs Google profile image from BetterAuth to User.profileImageUrl
 * Only updates if profileImageUrl is currently NULL
 */
export const POST = createProtectedHandler(
	async (_req, user) => {
		try {
			const session = await getSession();
			if (!session?.user?.id) {
				return Response.json({ error: "Invalid session" }, { status: 401 });
			}

			const synced = await syncGoogleProfileImage(session.user.id);

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

