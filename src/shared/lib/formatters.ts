/**
 * Shared formatting utilities
 */

/**
 * Format a user role string by replacing underscores with spaces
 * and capitalizing each word
 *
 * @example
 * formatRole("lab_administrator") // "Lab Administrator"
 * formatRole("external_member") // "External Member"
 */
export function formatRole(role: string): string {
	return role
		.replace(/_/g, " ")
		.replace(/\b\w/g, (c: string) => c.toUpperCase());
}
