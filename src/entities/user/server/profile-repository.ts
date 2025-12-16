/**
 * User Profile Repository
 * Data access layer for user profile operations
 */

import { db } from "@/shared/server/db";
import { ValidationError } from "@/shared/server/errors";
import type { UpdateProfileInput } from "../model/schemas";
import { updateProfileInputSchema } from "../model/schemas";

// ==============================================================
// Types
// ==============================================================

export interface UserProfileVM {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string | null;
	profileImageUrl: string | null; // UploadThing URL
	userType: string;
	academicType: string;
	userIdentifier: string | null;
	supervisorName: string | null;
	status: string;
	organization: {
		faculty?: string | null;
		department?: string | null;
		ikohza?: string | null;
		company?: string | null;
		branch?: string | null;
		facultyId?: string | null;
		departmentId?: string | null;
		ikohzaId?: string | null;
		companyId?: string | null;
		companyBranchId?: string | null;
		isMjiit?: boolean;
	};
	createdAt: string;
	lastLoginAt: string | null;
}

// UpdateProfileInput type is exported from ../model/schemas

// ==============================================================
// Helper Functions
// ==============================================================

/**
 * Determine if a faculty is MJIIT based on its code
 */
function isMjiitFaculty(code: string | null | undefined): boolean {
	return code?.toUpperCase() === "MJIIT";
}

// ==============================================================
// Query Functions
// ==============================================================

/**
 * Get user profile by user ID
 */
export async function getUserProfile(
	userId: string,
): Promise<UserProfileVM | null> {
	const user = await db.user.findUnique({
		where: { id: userId },
		include: {
			faculty: { select: { id: true, code: true, name: true } },
			department: { select: { id: true, name: true } },
			ikohza: { select: { id: true, name: true } },
			company: { select: { id: true, name: true } },
			companyBranch: { select: { id: true, name: true } },
		},
	});

	if (!user) return null;

	return {
		id: user.id,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email,
		phone: user.phone,
		profileImageUrl: user.profileImageUrl,
		userType: user.userType,
		academicType: user.academicType,
		userIdentifier: user.userIdentifier,
		supervisorName: user.supervisorName,
		status: user.status,
		organization: {
			faculty: user.faculty?.name ?? null,
			department: user.department?.name ?? null,
			ikohza: user.ikohza?.name ?? null,
			company: user.company?.name ?? null,
			branch: user.companyBranch?.name ?? null,
			facultyId: user.faculty?.id ?? null,
			departmentId: user.department?.id ?? null,
			ikohzaId: user.ikohza?.id ?? null,
			companyId: user.company?.id ?? null,
			companyBranchId: user.companyBranch?.id ?? null,
			isMjiit: isMjiitFaculty(user.faculty?.code),
		},
		createdAt: user.createdAt.toISOString(),
		lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
	};
}

/**
 * Update user profile
 */
export async function updateUserProfile(
	userId: string,
	input: UpdateProfileInput,
): Promise<UserProfileVM | null> {
	// Validate input using zod schema
	const validationResult = updateProfileInputSchema.safeParse(input);
	if (!validationResult.success) {
		const fieldErrors = validationResult.error.flatten().fieldErrors;
		const errorMessage =
			validationResult.error.errors[0]?.message || "Validation failed";
		throw new ValidationError(errorMessage, fieldErrors);
	}

	const validatedInput = validationResult.data;

	const user = await db.user.update({
		where: { id: userId },
		data: {
			...(validatedInput.firstName !== undefined && {
				firstName: validatedInput.firstName,
			}),
			...(validatedInput.lastName !== undefined && {
				lastName: validatedInput.lastName,
			}),
			...(validatedInput.phone !== undefined && {
				phone: validatedInput.phone,
			}),
			...(validatedInput.userIdentifier !== undefined && {
				userIdentifier: validatedInput.userIdentifier,
			}),
			...(validatedInput.supervisorName !== undefined && {
				supervisorName: validatedInput.supervisorName,
			}),
			...(validatedInput.facultyId !== undefined && {
				facultyId: validatedInput.facultyId,
			}),
			...(validatedInput.departmentId !== undefined && {
				departmentId: validatedInput.departmentId,
			}),
			...(validatedInput.ikohzaId !== undefined && {
				ikohzaId: validatedInput.ikohzaId,
			}),
			...(validatedInput.companyId !== undefined && {
				companyId: validatedInput.companyId,
			}),
			...(validatedInput.companyBranchId !== undefined && {
				companyBranchId: validatedInput.companyBranchId,
			}),
			updatedAt: new Date(),
		},
		include: {
			faculty: { select: { id: true, code: true, name: true } },
			department: { select: { id: true, name: true } },
			ikohza: { select: { id: true, name: true } },
			company: { select: { id: true, name: true } },
			companyBranch: { select: { id: true, name: true } },
		},
	});

	return {
		id: user.id,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email,
		phone: user.phone,
		profileImageUrl: user.profileImageUrl,
		userType: user.userType,
		academicType: user.academicType,
		userIdentifier: user.userIdentifier,
		supervisorName: user.supervisorName,
		status: user.status,
		organization: {
			faculty: user.faculty?.name ?? null,
			department: user.department?.name ?? null,
			ikohza: user.ikohza?.name ?? null,
			company: user.company?.name ?? null,
			branch: user.companyBranch?.name ?? null,
			facultyId: user.faculty?.id ?? null,
			departmentId: user.department?.id ?? null,
			ikohzaId: user.ikohza?.id ?? null,
			companyId: user.company?.id ?? null,
			companyBranchId: user.companyBranch?.id ?? null,
			isMjiit: isMjiitFaculty(user.faculty?.code),
		},
		createdAt: user.createdAt.toISOString(),
		lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
	};
}

/**
 * Update user profile image
 * @param userId - User ID
 * @param imageUrl - UploadThing URL, or null to remove
 * @returns Updated profile image URL, or null if user not found
 */
export async function updateUserProfileImage(
	userId: string,
	imageUrl: string | null,
): Promise<{ profileImageUrl: string | null } | null> {
	// Check if user exists first
	const existingUser = await db.user.findUnique({
		where: { id: userId },
		select: { id: true },
	});

	if (!existingUser) {
		return null;
	}

	const user = await db.user.update({
		where: { id: userId },
		data: {
			profileImageUrl: imageUrl,
			updatedAt: new Date(),
		},
		select: {
			profileImageUrl: true,
		},
	});

	return {
		profileImageUrl: user.profileImageUrl,
	};
}
