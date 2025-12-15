"use client";

import type { SampleStatus } from "@/entities/sample-tracking/model/types";
import { getSampleStatusConfig } from "@/shared/config/status-maps";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/shadcn/select";
import { useUpdateSampleStatus } from "../model/mutation";

const SAMPLE_STATUSES: SampleStatus[] = [
	"pending",
	"received",
	"in_analysis",
	"analysis_complete",
	"return_requested",
	"returned",
];

interface StatusCellProps {
	sampleId: string;
	currentStatus: SampleStatus;
	onChange?: (sampleId: string, status: string) => void;
}

export function StatusCell({
	sampleId,
	currentStatus,
	onChange,
}: StatusCellProps) {
	const mutation = useUpdateSampleStatus();

	const handleChange = (newStatus: string) => {
		mutation.mutate(
			{
				sampleId,
				status: newStatus as SampleStatus,
			},
			{
				onSuccess: () => {
					onChange?.(sampleId, newStatus);
				},
			},
		);
	};

	return (
		<Select
			disabled={mutation.isPending}
			onValueChange={handleChange}
			value={currentStatus}
		>
			<SelectTrigger className="w-[180px]">
				<SelectValue>{getSampleStatusConfig(currentStatus).label}</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{SAMPLE_STATUSES.map((status) => {
					const config = getSampleStatusConfig(status);
					return (
						<SelectItem key={status} value={status}>
							{config.label}
						</SelectItem>
					);
				})}
			</SelectContent>
		</Select>
	);
}
