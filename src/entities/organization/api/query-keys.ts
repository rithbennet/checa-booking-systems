export const organizationKeys = {
	all: ["organizations"] as const,
	faculties: () => [...organizationKeys.all, "faculties"] as const,
	companies: () => [...organizationKeys.all, "companies"] as const,
};
