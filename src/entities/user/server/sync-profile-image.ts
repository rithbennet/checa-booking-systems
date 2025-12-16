/**
 * Sync Google Profile Image Helper
 *
 * Syncs BetterAuth user's Google image URL to User.profileImageUrl
 * Only updates if profileImageUrl is currently NULL (never overwrites manual uploads)
 */

import { db } from "@/shared/server/db";

/**
 * Sync Google profile image from BetterAuth to User record
 * Only updates if User.profileImageUrl is NULL
 *
 * @param authUserId - The BetterAuth user ID
 * @returns true if image was synced, false otherwise
 */
export async function syncGoogleProfileImage(
	authUserId: string,
): Promise<boolean> {
	// Get BetterAuth user's Google image URL
	const authUser = await db.betterAuthUser.findUnique({
		where: { id: authUserId },
		select: { image: true },
	});

	if (!authUser?.image) {
		return false;
	}

	// Find the User record linked to this BetterAuth user
	const user = await db.user.findUnique({
		where: { authUserId },
		select: { id: true, profileImageUrl: true },
	});

	if (!user) {
		return false;
	}

	// Only sync if profileImageUrl is NULL (don't overwrite manual uploads)
	if (user.profileImageUrl !== null) {
		return false;
	}

	// Update profile image URL with Google image URL
	await db.user.update({
		where: { id: user.id },
		data: {
			profileImageUrl: authUser.image,
			updatedAt: new Date(),
		},
	});

	return true;
}
