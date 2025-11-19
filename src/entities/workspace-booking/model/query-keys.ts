/**
 * Query keys for workspace booking entity
 * Month-range scoped keys for calendar schedule
 */

export const workspaceBookingKeys = {
	all: ["workspace-booking"] as const,
	scheduleRange: (from: Date | string, to: Date | string) =>
		[...workspaceBookingKeys.all, "schedule", from, to] as const,
};
