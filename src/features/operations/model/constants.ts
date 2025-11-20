/**
 * Operations Feature Constants
 * Tab IDs, copy, and route paths
 */

export const OPERATIONS_TABS = {
	SAMPLES: "samples",
	WORKSPACE: "workspace",
} as const;

export type OperationsTab =
	(typeof OPERATIONS_TABS)[keyof typeof OPERATIONS_TABS];

export const OPERATIONS_TAB_LABELS: Record<OperationsTab, string> = {
	[OPERATIONS_TABS.SAMPLES]: "Samples",
	[OPERATIONS_TABS.WORKSPACE]: "Workspace",
};

export const OPERATIONS_ROUTE = "/admin/operations";
