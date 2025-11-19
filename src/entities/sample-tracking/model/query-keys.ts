/**
 * Query keys for sample tracking entity
 * Namespaced and stable across tabs/widgets
 */

export const sampleTrackingKeys = {
	all: ["sample-tracking"] as const,
	operationsList: (params: {
		status?: string[];
		q?: string;
		page?: number;
		pageSize?: number;
	}) => [...sampleTrackingKeys.all, "operations", "list", params] as const,
	userActive: (userId: string) =>
		[...sampleTrackingKeys.all, "user", userId, "active"] as const,
};
