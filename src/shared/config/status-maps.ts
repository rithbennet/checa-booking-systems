/**
 * Status Maps Configuration
 * Centralized status labels, colors, and semantic intent
 */

import type { VariantProps } from "class-variance-authority";
import type { SampleStatus } from "@/entities/sample-tracking/model/types";
import type { badgeVariants } from "@/shared/ui/shadcn/badge";

/**
 * Sample status configuration
 */
export interface SampleStatusConfig {
	label: string;
	variant: VariantProps<typeof badgeVariants>["variant"];
	className: string;
	semanticIntent: "info" | "warning" | "success" | "error" | "neutral";
}

export const SAMPLE_STATUS_CONFIG: Record<SampleStatus, SampleStatusConfig> = {
	pending: {
		label: "Pending",
		variant: "outline",
		className: "bg-gray-50 text-gray-700 border-gray-300",
		semanticIntent: "neutral",
	},
	received: {
		label: "Received",
		variant: "default",
		className: "bg-blue-50 text-blue-700 border-blue-300",
		semanticIntent: "info",
	},
	in_analysis: {
		label: "In Analysis",
		variant: "default",
		className: "bg-yellow-50 text-yellow-700 border-yellow-300",
		semanticIntent: "warning",
	},
	analysis_complete: {
		label: "Analysis Complete",
		variant: "default",
		className: "bg-green-50 text-green-700 border-green-300",
		semanticIntent: "success",
	},
	return_requested: {
		label: "Return Requested",
		variant: "secondary",
		className: "bg-purple-50 text-purple-700 border-purple-300",
		semanticIntent: "info",
	},
	returned: {
		label: "Returned",
		variant: "default",
		className: "bg-gray-50 text-gray-600 border-gray-300",
		semanticIntent: "neutral",
	},
};

/**
 * Get sample status configuration
 */
export function getSampleStatusConfig(
	status: SampleStatus,
): SampleStatusConfig {
	return (
		SAMPLE_STATUS_CONFIG[status] ?? {
			label: status,
			variant: "outline",
			className: "bg-gray-50 text-gray-700 border-gray-300",
			semanticIntent: "neutral",
		}
	);
}
