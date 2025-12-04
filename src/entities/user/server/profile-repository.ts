/**
 * User Profile Repository
 * Data access layer for user profile operations
 */

import { db } from "@/shared/server/db";

// ==============================================================
// Types
// ==============================================================

export interface UserProfileVM {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string | null;
	profileImageUrl: string | null;
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

export interface UpdateProfileInput {
	firstName?: string;
	lastName?: string;
	phone?: string | null;
	userIdentifier?: string;
	supervisorName?: string | null;
	facultyId?: string | null;
	departmentId?: string | null;
	ikohzaId?: string | null;
	companyId?: string | null;
	companyBranchId?: string | null;
}

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
			facultyRelation: { select: { id: true, code: true, name: true } },
			departmentRelation: { select: { id: true, name: true } },
			ikohza: { select: { id: true, name: true } },
			companyRelation: { select: { id: true, name: true } },
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
			faculty: user.facultyRelation?.name ?? null,
			department: user.departmentRelation?.name ?? null,
			ikohza: user.ikohza?.name ?? null,
			company: user.companyRelation?.name ?? null,
			branch: user.companyBranch?.name ?? null,
			facultyId: user.facultyRelation?.id ?? null,
			departmentId: user.departmentRelation?.id ?? null,
			ikohzaId: user.ikohza?.id ?? null,
			companyId: user.companyRelation?.id ?? null,
			companyBranchId: user.companyBranch?.id ?? null,
			isMjiit: isMjiitFaculty(user.facultyRelation?.code),
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
	const user = await db.user.update({
		where: { id: userId },
		data: {
			firstName: input.firstName,
			lastName: input.lastName,
			phone: input.phone,
			userIdentifier: input.userIdentifier,
			supervisorName: input.supervisorName,
			facultyId: input.facultyId,
			departmentId: input.departmentId,
			ikohzaId: input.ikohzaId,
			companyId: input.companyId,
			companyBranchId: input.companyBranchId,
			updatedAt: new Date(),
		},
		include: {
			facultyRelation: { select: { id: true, code: true, name: true } },
			departmentRelation: { select: { id: true, name: true } },
			ikohza: { select: { id: true, name: true } },
			companyRelation: { select: { id: true, name: true } },
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
			faculty: user.facultyRelation?.name ?? null,
			department: user.departmentRelation?.name ?? null,
			ikohza: user.ikohza?.name ?? null,
			company: user.companyRelation?.name ?? null,
			branch: user.companyBranch?.name ?? null,
			facultyId: user.facultyRelation?.id ?? null,
			departmentId: user.departmentRelation?.id ?? null,
			ikohzaId: user.ikohza?.id ?? null,
			companyId: user.companyRelation?.id ?? null,
			companyBranchId: user.companyBranch?.id ?? null,
			isMjiit: isMjiitFaculty(user.facultyRelation?.code),
		},
		createdAt: user.createdAt.toISOString(),
		lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
	};
}
