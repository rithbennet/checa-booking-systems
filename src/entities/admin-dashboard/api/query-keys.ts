export const adminDashboardKeys = {
	all: ["admin-dashboard"] as const,
	metrics: () => [...adminDashboardKeys.all, "metrics"] as const,
	status: () => [...adminDashboardKeys.all, "status"] as const,
	activity: () => [...adminDashboardKeys.all, "activity"] as const,
};
