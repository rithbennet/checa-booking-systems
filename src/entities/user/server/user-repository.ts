import { db } from "@/shared/server/db";
import { ValidationError } from "@/shared/server/errors";
import type {
	AdminUpdateUserInput,
	UserListFilters,
	UserListItemVM,
	UserStatusCounts,
} from "../model/types";

/**
 * Get paginated list of users for admin management
 */
export async function getUserListData(
	filters: UserListFilters,
): Promise<{ items: UserListItemVM[]; total: number }> {
	const { page, pageSize, query, status, userType, sort } = filters;

	// Build where clause
	const where: Record<string, unknown> = {};

	if (query) {
		where.OR = [
			{ firstName: { contains: query, mode: "insensitive" } },
			{ lastName: { contains: query, mode: "insensitive" } },
			{ email: { contains: query, mode: "insensitive" } },
			{ userIdentifier: { contains: query, mode: "insensitive" } },
		];
	}

	if (status) {
		where.status = status;
	}

	if (userType && userType !== "all") {
		where.userType = userType;
	}

	// Build order by
	type OrderByType = { createdAt?: "asc" | "desc"; firstName?: "asc" | "desc" };
	let orderBy: OrderByType = { createdAt: "desc" };
	switch (sort) {
		case "created_oldest":
			orderBy = { createdAt: "asc" };
			break;
		case "name_asc":
			orderBy = { firstName: "asc" };
			break;
		case "name_desc":
			orderBy = { firstName: "desc" };
			break;
		default:
			orderBy = { createdAt: "desc" };
	}

	// Execute query
	const [users, total] = await Promise.all([
		db.user.findMany({
			where,
			orderBy,
			skip: (page - 1) * pageSize,
			take: pageSize,
			include: {
				faculty: { select: { name: true } },
				department: { select: { name: true } },
				ikohza: { select: { name: true } },
				company: { select: { name: true } },
				companyBranch: { select: { name: true } },
			},
		}),
		db.user.count({ where }),
	]);

	// Map to view model
	const items: UserListItemVM[] = users.map((user) => ({
		id: user.id,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email,
		phone: user.phone,
		userType: user.userType,
		status: user.status,
		academicType: user.academicType,
		userIdentifier: user.userIdentifier,
		supervisorName: user.supervisorName,
		createdAt: user.createdAt.toISOString(),
		approvedAt: user.approvedAt?.toISOString() || null,
		organization:
			user.userType === "external_member"
				? {
						company: user.company?.name,
						branch: user.companyBranch?.name,
					}
				: user.userType === "mjiit_member" || user.userType === "utm_member"
					? {
							faculty: user.faculty?.name,
							department: user.department?.name,
							ikohza: user.ikohza?.name,
						}
					: null,
	}));

	return { items, total };
}

/**
 * Get user status counts for admin dashboard
 */
export async function getUserStatusCounts(): Promise<UserStatusCounts> {
	const [all, pending, active, inactive, rejected, suspended] =
		await Promise.all([
			db.user.count(),
			db.user.count({ where: { status: "pending" } }),
			db.user.count({ where: { status: "active" } }),
			db.user.count({ where: { status: "inactive" } }),
			db.user.count({ where: { status: "rejected" } }),
			db.user.count({ where: { status: "suspended" } }),
		]);

	return { all, pending, active, inactive, rejected, suspended };
}

/**
 * Approve a pending user
 */
export async function approveUser(userId: string, approvedById: string) {
	return db.user.update({
		where: { id: userId },
		data: {
			status: "active",
			approvedAt: new Date(),
			approvedBy: approvedById,
		},
	});
}

/**
 * Reject a pending user
 */
export async function rejectUser(userId: string) {
	return db.user.update({
		where: { id: userId },
		data: {
			status: "rejected",
		},
	});
}

/**
 * Update user status
 */
export async function updateUserStatus(
	userId: string,
	status: "active" | "inactive" | "suspended",
) {
	return db.user.update({
		where: { id: userId },
		data: { status },
	});
}

/**
 * Update user type
 */
export async function updateUserType(
	userId: string,
	userType:
		| "mjiit_member"
		| "utm_member"
		| "external_member"
		| "lab_administrator",
) {
	return db.user.update({
		where: { id: userId },
		data: { userType },
	});
}

/**
 * Helper function to check if a faculty is MJIIT
 */
function isMjiitFacultyCode(code: string | null | undefined): boolean {
	return code?.toUpperCase() === "MJIIT";
}

/**
 * Admin update user - allows updating all fields except email
 * Returns the updated user and list of changed fields
 */
export async function adminUpdateUser(
	userId: string,
	input: AdminUpdateUserInput,
): Promise<{
	user: Awaited<ReturnType<typeof db.user.findUnique>>;
	changedFields: string[];
}> {
	// Get current user to compare changes
	const currentUser = await db.user.findUnique({
		where: { id: userId },
		select: {
			firstName: true,
			lastName: true,
			phone: true,
			userType: true,
			academicType: true,
			userIdentifier: true,
			supervisorName: true,
			facultyId: true,
			departmentId: true,
			ikohzaId: true,
			companyId: true,
			companyBranchId: true,
			status: true,
		},
	});

	if (!currentUser) {
		throw new Error("User not found");
	}

	// Determine the effective userType (use input if provided, otherwise current)
	const effectiveUserType = input.userType ?? currentUser.userType;

	// Validation: UTM members cannot have ikohzaId
	if (effectiveUserType === "utm_member") {
		const effectiveIkohzaId =
			input.ikohzaId !== undefined ? input.ikohzaId : currentUser.ikohzaId;
		// Reject null, undefined, and empty strings
		if (
			effectiveIkohzaId !== null &&
			effectiveIkohzaId !== undefined &&
			effectiveIkohzaId !== ""
		) {
			throw new ValidationError("UTM members cannot have an iKohza", {
				ikohzaId: ["UTM members cannot have an iKohza"],
			});
		}
	}

	// Validation: MJIIT members must have MJIIT faculty
	if (effectiveUserType === "mjiit_member") {
		const effectiveFacultyId =
			input.facultyId !== undefined ? input.facultyId : currentUser.facultyId;
		if (effectiveFacultyId !== null) {
			const faculty = await db.faculty.findUnique({
				where: { id: effectiveFacultyId },
				select: { code: true },
			});

			if (!faculty) {
				throw new ValidationError("Faculty not found", {
					facultyId: ["Faculty not found"],
				});
			}

			if (!isMjiitFacultyCode(faculty.code)) {
				throw new ValidationError(
					"MJIIT members must belong to MJIIT faculty",
					{ facultyId: ["MJIIT members must belong to MJIIT faculty"] },
				);
			}
		}
	}

	// Track changed fields using Set to prevent duplicates
	const changedFieldsSet = new Set<string>();

	// Build update data with only provided fields
	const updateData: Record<string, unknown> = {};

	if (
		input.firstName !== undefined &&
		input.firstName.trim() !== currentUser.firstName
	) {
		updateData.firstName = input.firstName.trim();
		changedFieldsSet.add("firstName");
	}

	if (
		input.lastName !== undefined &&
		input.lastName.trim() !== currentUser.lastName
	) {
		updateData.lastName = input.lastName.trim();
		changedFieldsSet.add("lastName");
	}

	if (input.phone !== undefined && input.phone !== currentUser.phone) {
		updateData.phone = input.phone;
		changedFieldsSet.add("phone");
	}

	if (input.userType !== undefined && input.userType !== currentUser.userType) {
		updateData.userType = input.userType;
		changedFieldsSet.add("userType");

		// Clear ikohzaId when switching to UTM member
		if (input.userType === "utm_member" && currentUser.ikohzaId) {
			updateData.ikohzaId = null;
			changedFieldsSet.add("ikohzaId");
		}
	}

	if (
		input.academicType !== undefined &&
		input.academicType !== currentUser.academicType
	) {
		updateData.academicType = input.academicType;
		changedFieldsSet.add("academicType");
	}

	if (
		input.userIdentifier !== undefined &&
		input.userIdentifier !== currentUser.userIdentifier
	) {
		updateData.userIdentifier = input.userIdentifier;
		changedFieldsSet.add("userIdentifier");
	}

	if (
		input.supervisorName !== undefined &&
		input.supervisorName !== currentUser.supervisorName
	) {
		updateData.supervisorName = input.supervisorName;
		changedFieldsSet.add("supervisorName");
	}

	if (
		input.facultyId !== undefined &&
		input.facultyId !== currentUser.facultyId
	) {
		updateData.facultyId = input.facultyId;
		changedFieldsSet.add("facultyId");
	}

	if (
		input.departmentId !== undefined &&
		input.departmentId !== currentUser.departmentId
	) {
		updateData.departmentId = input.departmentId;
		changedFieldsSet.add("departmentId");
	}

	if (input.ikohzaId !== undefined && input.ikohzaId !== currentUser.ikohzaId) {
		updateData.ikohzaId = input.ikohzaId;
		// Only add if not already added (e.g., from userType change above)
		if (!changedFieldsSet.has("ikohzaId")) {
			changedFieldsSet.add("ikohzaId");
		}
	}

	if (
		input.companyId !== undefined &&
		input.companyId !== currentUser.companyId
	) {
		updateData.companyId = input.companyId;
		changedFieldsSet.add("companyId");
	}

	if (
		input.companyBranchId !== undefined &&
		input.companyBranchId !== currentUser.companyBranchId
	) {
		updateData.companyBranchId = input.companyBranchId;
		changedFieldsSet.add("companyBranchId");
	}

	if (input.status !== undefined && input.status !== currentUser.status) {
		updateData.status = input.status;
		changedFieldsSet.add("status");
	}

	// Convert Set to array
	const changedFields = Array.from(changedFieldsSet);

	// Only update if there are changes
	if (Object.keys(updateData).length === 0) {
		// Return current user if no changes
		const fullUser = await db.user.findUnique({
			where: { id: userId },
		});
		return { user: fullUser, changedFields: [] };
	}

	// Add updatedAt
	updateData.updatedAt = new Date();

	// Perform update
	const updatedUser = await db.user.update({
		where: { id: userId },
		data: updateData,
	});

	return { user: updatedUser, changedFields };
}
