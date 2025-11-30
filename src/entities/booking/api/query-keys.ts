export const bookingKeys = {
	all: ["bookings"] as const,
	adminList: (params: Record<string, unknown>) =>
		[...bookingKeys.all, "admin", "list", params] as const,
	adminDetail: (id: string) =>
		[...bookingKeys.all, "admin", "detail", id] as const,
	commandCenter: (id: string) =>
		[...bookingKeys.all, "admin", "commandCenter", id] as const,
	userDetail: (id: string) =>
		[...bookingKeys.all, "user", "detail", id] as const,
};
