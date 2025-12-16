import { Prisma } from "generated/prisma";
import { z } from "zod";
import { updateUserProfileImage } from "@/entities/user/server/profile-repository";
import { createProtectedHandler } from "@/shared/lib/api-factory";
import { db } from "@/shared/server/db";
import { ValidationError } from "@/shared/server/errors";
import { utapi } from "@/shared/server/uploadthing";

/**
 * Profile image update validation schema
 */
const updateProfileImageSchema = z.object({
	imageUrl: z
		.string()
		.url("Image URL must be a valid URL")
		.nullable()
		.optional()
		.refine((url) => {
			// Allow null/undefined to remove image
			if (url === null || url === undefined) return true;
			// Otherwise must be a valid HTTPS URL (UploadThing URL)
			return url.startsWith("https://");
		}, "Image URL must be a valid HTTPS URL"),
});

/**
 * PATCH /api/user/profile-image
 * Updates the current user's profile image
 */
export const PATCH = createProtectedHandler(
	async (req, user) => {
		try {
			const body = await req.json();
			const result = updateProfileImageSchema.safeParse(body);

			if (!result.success) {
				console.error("Validation error:", result.error.flatten());
				return Response.json(
					{
						error: "Validation failed",
						details: result.error.flatten().fieldErrors,
					},
					{ status: 400 },
				);
			}

			const { imageUrl } = result.data;

			// If removing image (null), delete old image from UploadThing
			if (imageUrl === null || imageUrl === undefined) {
				// Get current user to find old profile image
				const currentUser = await db.user.findUnique({
					where: { id: user.id },
					select: { profileImageUrl: true },
				});

				// Delete old profile image if it exists and is an UploadThing URL
				if (currentUser?.profileImageUrl) {
					try {
						// Find FileBlob with the old URL
						const oldBlob = await db.fileBlob.findFirst({
							where: { url: currentUser.profileImageUrl },
						});

						if (oldBlob) {
							// Delete FileBlob record first, then remove from storage
							await db.fileBlob.delete({ where: { id: oldBlob.id } });
							// Delete from UploadThing storage after DB delete succeeds
							await utapi.deleteFiles(oldBlob.key);
						}
					} catch (error) {
						// Log but don't fail - old image deletion is not critical
						console.error("Failed to delete old profile image:", error);
					}
				}
			}

			// Update profile image (null is allowed to remove image)
			let updated: { profileImageUrl: string | null } | null;
			try {
				updated = await updateUserProfileImage(user.id, imageUrl ?? null);
			} catch (error) {
				// Handle Prisma record not found error (P2025) as 404
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code === "P2025"
				) {
					return Response.json({ error: "Profile not found" }, { status: 404 });
				}
				// Re-throw other errors to be handled by outer catch
				throw error;
			}

			if (!updated) {
				return Response.json({ error: "Profile not found" }, { status: 404 });
			}

			return Response.json({
				success: true,
				profileImageUrl: updated.profileImageUrl,
			});
		} catch (error) {
			console.error("Error updating profile image:", error);

			// Handle validation errors (return 400)
			if (error instanceof ValidationError) {
				return Response.json(
					{
						error: error.error,
						...(error.details && { details: error.details }),
					},
					{ status: 400 },
				);
			}

			if (error instanceof Error) {
				console.error("Error details:", {
					message: error.message,
					stack: error.stack,
					name: error.name,
				});
			} else {
				console.error("Error details:", error);
			}
			return Response.json(
				{ error: "Failed to update profile image" },
				{ status: 500 },
			);
		}
	},
	{ requireActive: false }, // Allow pending users to update their profile image
);
