/**
 * User entity types
 *
 * This file contains type definitions for the User entity.
 * Entities represent core business concepts.
 */

export type UserType =
	| "mjiit_member"
	| "utm_member"
	| "external_member"
	| "lab_administrator";

export type UserStatus =
	| "pending"
	| "active"
	| "inactive"
	| "rejected"
	| "suspended";

export type AcademicType = "student" | "staff" | "none";

export interface User {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface UserSession {
	user: User;
	expiresAt: Date;
}

/**
 * User list item view model for admin management
 */
export interface UserListItemVM {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string | null;
	userType: UserType;
	status: UserStatus;
	academicType: AcademicType;
	userIdentifier: string | null;
	supervisorName: string | null;
	createdAt: string;
	approvedAt: string | null;
	organization: {
		faculty?: string;
		department?: string;
		ikohza?: string;
		company?: string;
		branch?: string;
	} | null;
}

/**
 * Filter parameters for user list
 */
export interface UserListFilters {
	page: number;
	pageSize: 10 | 25 | 50;
	query?: string;
	status?: UserStatus;
	userType?: UserType | "all";
	sort: UserSortKey;
}

export type UserSortKey =
	| "created_newest"
	| "created_oldest"
	| "name_asc"
	| "name_desc";

/**
 * Status counts for user list
 */
export interface UserStatusCounts {
	all: number;
	pending: number;
	active: number;
	inactive: number;
	rejected: number;
	suspended: number;
}

/**
 * Admin update user input
 * Type exported from schemas.ts (Zod-inferred type)
 * @see ../model/schemas.ts
 */

/**
 * User summary view model for admin view
 * Contains comprehensive user activity and usage data
 */
export interface UserSummaryVM {
	bookingOverview: {
		total: number;
		upcoming: number;
		completed: number;
		cancelled: number;
		rejected: number;
	};
	recentBookings: Array<{
		id: string;
		referenceNumber: string;
		status: string;
		totalAmount: number;
		createdAt: string;
	}>;
	financialSummary: {
		totalSpent: number;
		outstanding: number;
		pending: number;
		lastPaymentDate: string | null;
		lastPaymentAmount: number | null;
	};
	usagePatterns: {
		topServices: Array<{ name: string; count: number }>;
		topEquipment: Array<{ name: string; count: number }>;
		averageBookingFrequency: number | null; // bookings per month, null if insufficient data
	};
	documentStatus: {
		totalDocuments: number;
		verified: number;
		pending: number;
		rejected: number;
	};
}
