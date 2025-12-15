import { db } from "@/shared/server/db";
import type {
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
				facultyRelation: { select: { name: true } },
				departmentRelation: { select: { name: true } },
				ikohza: { select: { name: true } },
				companyRelation: { select: { name: true } },
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
						company: user.companyRelation?.name,
						branch: user.companyBranch?.name,
					}
				: user.userType === "mjiit_member" || user.userType === "utm_member"
					? {
							faculty: user.facultyRelation?.name,
							department: user.departmentRelation?.name,
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
