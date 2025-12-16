import { format } from "date-fns";
import type {
	AcademicType,
	UserStatus,
	UserType,
} from "@/entities/user/model/types";

/**
 * Format user's full name
 */
export function formatFullName(firstName: string, lastName: string): string {
	return `${firstName} ${lastName}`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
	return format(new Date(dateString), "MMM d, yyyy");
}

/**
 * Format user type for display
 */
export function formatUserType(userType: UserType): string {
	const labels: Record<UserType, string> = {
		mjiit_member: "MJIIT Member",
		utm_member: "UTM Member",
		external_member: "External",
		lab_administrator: "Administrator",
	};
	return labels[userType];
}

/**
 * Get badge variant for user type
 */
export function getUserTypeBadgeClass(userType: UserType): string {
	const classes: Record<UserType, string> = {
		mjiit_member:
			"bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
		utm_member:
			"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
		external_member:
			"bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
		lab_administrator:
			"bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
	};
	return classes[userType];
}

/**
 * Get badge class for user status
 */
export function getUserStatusBadgeClass(status: UserStatus): string {
	const classes: Record<UserStatus, string> = {
		pending:
			"bg-yellow-100 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-900 dark:text-yellow-300",
		active:
			"bg-green-100 text-green-800 ring-green-600/20 dark:bg-green-900 dark:text-green-300",
		inactive:
			"bg-gray-100 text-gray-800 ring-gray-600/20 dark:bg-gray-900 dark:text-gray-300",
		rejected:
			"bg-red-100 text-red-800 ring-red-600/20 dark:bg-red-900 dark:text-red-300",
		suspended:
			"bg-orange-100 text-orange-800 ring-orange-600/20 dark:bg-orange-900 dark:text-orange-300",
	};
	return classes[status];
}

/**
 * Format user status for display
 */
export function formatUserStatus(status: UserStatus): string {
	return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Format academic type for display
 */
export function formatAcademicType(academicType: AcademicType): string {
	const labels: Record<AcademicType, string> = {
		student: "Student",
		staff: "Staff",
		none: "N/A",
	};
	return labels[academicType];
}
