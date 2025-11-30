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
	};
	createdAt: string;
	lastLoginAt: string | null;
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
			facultyRelation: { select: { name: true } },
			departmentRelation: { select: { name: true } },
			ikohza: { select: { name: true } },
			companyRelation: { select: { name: true } },
			companyBranch: { select: { name: true } },
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
		},
		createdAt: user.createdAt.toISOString(),
		lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
	};
}
