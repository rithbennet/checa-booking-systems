/**
 * Map user role from session to UserType
 */

import type { UserType } from "@/entities/service";

/**
 * Convert session role to UserType
 * @param role - User role from session (can be "lab_administrator", "mjiit_member", "utm_member", "external_member", or null)
 * @returns UserType or defaults to "external_member"
 */
export function mapRoleToUserType(role: string | null | undefined): UserType {
	if (!role) {
		return "external_member";
	}

	switch (role) {
		case "mjiit_member":
			return "mjiit_member";
		case "utm_member":
			return "utm_member";
		case "external_member":
			return "external_member";
		case "lab_administrator":
			// Lab administrators can see MJIIT pricing
			return "mjiit_member";
		default:
			return "external_member";
	}
}
