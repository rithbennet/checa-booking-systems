/**
 * User Registration Repository
 * Handles user creation and related lookups for registration/onboarding
 */

import { db } from "@/shared/server/db";
import type { AcademicType, UserType } from "../model/types";
import { syncGoogleProfileImage } from "./sync-profile-image";

// ==============================================================
// Types
// ==============================================================

export interface FacultyLookupResult {
	id: string;
	code: string;
}

export interface CreateUserInput {
	email: string;
	firstName: string;
	lastName: string;
	phone: string;
	userType: UserType;
	academicType: AcademicType;
	userIdentifier?: string | null;
	supervisorName?: string | null;
	authUserId: string;
	profileImageUrl?: Buffer | null; // Binary image data (BYTEA)
	emailVerifiedAt?: Date | null;
	facultyId?: string;
	departmentId?: string;
	ikohzaId?: string;
	companyId?: string;
	companyBranchId?: string;
}

// ==============================================================
// Query Functions
// ==============================================================

/**
 * Look up faculty by ID
 */
export async function lookupFacultyById(
	facultyId: string,
): Promise<FacultyLookupResult | null> {
	const faculty = await db.faculty.findFirst({
		where: {
			id: facultyId,
			isActive: true,
		},
		select: { id: true, code: true },
	});

	return faculty;
}

/**
 * Look up department by ID and faculty ID
 */
export async function lookupDepartmentById(
	departmentId: string,
	facultyId: string,
): Promise<{ id: string } | null> {
	const dept = await db.department.findFirst({
		where: {
			id: departmentId,
			facultyId,
			isActive: true,
		},
		select: { id: true },
	});

	return dept;
}

/**
 * Look up ikohza by ID and faculty ID
 */
export async function lookupIkohzaById(
	ikohzaId: string,
	facultyId: string,
): Promise<{ id: string } | null> {
	const ikohza = await db.ikohza.findFirst({
		where: {
			id: ikohzaId,
			facultyId,
			isActive: true,
		},
		select: { id: true },
	});

	return ikohza;
}

/**
 * Check if user exists by authUserId
 */
export async function userExistsByAuthId(authUserId: string): Promise<boolean> {
	const user = await db.user.findUnique({
		where: { authUserId },
		select: { id: true },
	});

	return !!user;
}

/**
 * Check if user exists by email
 */
export async function userExistsByEmail(email: string): Promise<boolean> {
	const user = await db.user.findUnique({
		where: { email },
		select: { id: true },
	});

	return !!user;
}

/**
 * Get all active admin user IDs
 */
export async function getActiveAdminIds(): Promise<string[]> {
	const admins = await db.user.findMany({
		where: { userType: "lab_administrator", status: "active" },
		select: { id: true },
	});
	return admins.map((a) => a.id);
}

/**
 * Create a new user with all relations
 */
export async function createUser(input: CreateUserInput) {
	const user = await db.user.create({
		data: {
			email: input.email,
			firstName: input.firstName,
			lastName: input.lastName,
			phone: input.phone,
			userType: input.userType,
			academicType: input.academicType,
			userIdentifier: input.userIdentifier || null,
			supervisorName: input.supervisorName || null,
			profileImageUrl: input.profileImageUrl || null,
			emailVerifiedAt: input.emailVerifiedAt || null,
			status: "pending",
			authUser: {
				connect: { id: input.authUserId },
			},
			// Academic organization (internal members)
			...(input.facultyId && {
				facultyRelation: { connect: { id: input.facultyId } },
			}),
			...(input.departmentId && {
				departmentRelation: { connect: { id: input.departmentId } },
			}),
			...(input.ikohzaId && {
				ikohza: { connect: { id: input.ikohzaId } },
			}),
			// External organization
			...(input.companyId && {
				companyRelation: { connect: { id: input.companyId } },
			}),
			...(input.companyBranchId && {
				companyBranch: { connect: { id: input.companyBranchId } },
			}),
		},
		select: {
			id: true,
			email: true,
			firstName: true,
			lastName: true,
		},
	});

	// Sync Google profile image if available and profileImageUrl is null
	// This handles the case where input.profileImageUrl was not provided
	if (!input.profileImageUrl) {
		await syncGoogleProfileImage(input.authUserId);
	}

	return user;
}
