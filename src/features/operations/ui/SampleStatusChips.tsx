"use client";

import type { SampleStatus } from "@/entities/sample-tracking/model/types";
import { getSampleStatusConfig } from "@/shared/config/status-maps";
import { Badge } from "@/shared/ui/shadcn/badge";

const SAMPLE_STATUSES: SampleStatus[] = [
	"pending",
	"received",
	"in_analysis",
	"analysis_complete",
	"return_requested",
	"returned",
];

export function SampleStatusChips({
	active,
	onChange,
}: {
	active: string[] | undefined;
	onChange: (next: string[] | undefined) => void;
}) {
	const isAll = !active || active.length === 0;

	return (
		<div className="flex flex-wrap items-center gap-2">
			<Badge
				className={
					isAll
						? "rounded-full bg-slate-100 text-slate-800 ring-2 ring-slate-500 transition-all hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-100"
						: "cursor-pointer rounded-full bg-gray-100 text-gray-700 transition-all hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
				}
				onClick={() => onChange(undefined)}
				variant="secondary"
			>
				All
			</Badge>
			{SAMPLE_STATUSES.map((status) => {
				const config = getSampleStatusConfig(status);
				const isActive = active?.includes(status);
				return (
					<Badge
						className={
							isActive
								? `${config.className} ring-2 transition-all`
								: "cursor-pointer rounded-full bg-gray-100 text-gray-700 transition-all hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
						}
						key={status}
						onClick={() => onChange([status])}
						variant="secondary"
					>
						{config.label}
					</Badge>
				);
			})}
		</div>
	);
}
