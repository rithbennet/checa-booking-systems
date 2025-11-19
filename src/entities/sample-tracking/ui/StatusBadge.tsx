/**
 * Sample Status Badge Component
 * Uses shared status map for consistent styling
 */

import { getSampleStatusConfig } from "@/shared/config/status-maps";
import { Badge } from "@/shared/ui/shadcn/badge";
import type { SampleStatus } from "../model/types";

interface SampleStatusBadgeProps {
	status: SampleStatus;
	className?: string;
}

export function SampleStatusBadge({
	status,
	className,
}: SampleStatusBadgeProps) {
	const config = getSampleStatusConfig(status);

	return (
		<Badge
			className={`${config.className} ${className ?? ""}`}
			variant={config.variant}
		>
			{config.label}
		</Badge>
	);
}
