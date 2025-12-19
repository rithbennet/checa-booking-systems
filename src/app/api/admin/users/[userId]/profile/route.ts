import { notifyUserAccountUpdated } from "@/entities/notification/server/user.notifications";
import { adminUpdateUserInputSchema } from "@/entities/user/model/schemas";
import { getUserProfile } from "@/entities/user/server/profile-repository";
import { adminUpdateUser } from "@/entities/user/server/user-repository";
import {
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";
import { ValidationError } from "@/shared/server/errors";

/**
 * Admin update user input schema
 * Validates that email is NOT included and validates all other fields
 */
const adminUpdateUserSchema = adminUpdateUserInputSchema.refine(
	(data) => {
		// Explicitly reject email field if present
		return !("email" in data);
	},
	{
		message: "Email cannot be changed by admins",
	},
);

/**
 * GET /api/admin/users/[userId]/profile
 * Get user profile for admin view
 */
export const GET = createProtectedHandler(
	async (_request: Request, user, context) => {
		try {
			if (user.role !== "lab_administrator") return forbidden();

			const params = await context?.params;
			const userId = params?.userId as string;

			if (!userId) {
				return Response.json({ error: "User ID required" }, { status: 400 });
			}

			const profile = await getUserProfile(userId);

			if (!profile) {
				return Response.json({ error: "User not found" }, { status: 404 });
			}

			return Response.json(profile);
		} catch (error) {
			console.error("Error fetching user profile:", error);
			return serverError("Failed to fetch user profile");
		}
	},
);

/**
 * PATCH /api/admin/users/[userId]/profile
 * Admin update user profile - allows updating all fields except email
 */
export const PATCH = createProtectedHandler(
	async (request: Request, user, context) => {
		try {
			if (user.role !== "lab_administrator") return forbidden();

			const params = await context?.params;
			const userId = params?.userId as string;

			if (!userId) {
				return Response.json({ error: "User ID required" }, { status: 400 });
			}

			const body = await request.json();

			// Validate schema
			const result = adminUpdateUserSchema.safeParse(body);
			if (!result.success) {
				return Response.json(
					{
						error: "Validation failed",
						details: result.error.flatten().fieldErrors,
					},
					{ status: 400 },
				);
			}

			const input = result.data;

			// Update user
			const { changedFields } = await adminUpdateUser(userId, input);

			// Only send notification if there were actual changes
			if (changedFields.length > 0) {
				// Notify user (in-app notification + email)
				// Wrap in try-catch so notification failures don't affect the update response
				try {
					await notifyUserAccountUpdated({
						userId,
						changedFields,
					});
				} catch (notificationError) {
					console.error("Failed to send notification:", notificationError);
					// Continue execution - don't fail the request if notification fails
				}
			}

			// Return updated profile
			const updatedProfile = await getUserProfile(userId);

			return Response.json({
				success: true,
				message: "User updated successfully",
				profile: updatedProfile,
				changedFields,
			});
		} catch (error) {
			// Handle ValidationError from repository
			if (error instanceof ValidationError) {
				return Response.json(
					{
						error: error.error,
						...(error.details && { details: error.details }),
					},
					{ status: 400 },
				);
			}
			console.error("Error updating user:", error);
			return serverError("Failed to update user");
		}
	},
);
