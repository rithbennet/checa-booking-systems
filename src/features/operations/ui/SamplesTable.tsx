"use client";

import { format } from "date-fns";
import { Eye } from "lucide-react";
import type { SampleOperationsRow } from "@/entities/sample-tracking/model/types";
import { StatusCell } from "@/features/operations/sample-status/ui/StatusCell";
import RouterButton from "@/shared/ui/router-button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/shadcn/table";

interface SamplesTableProps {
	rows: SampleOperationsRow[];
	isLoading: boolean;
	onStatusChange: (sampleId: string, status: string) => void;
}

export function SamplesTable({
	rows,
	isLoading,
	onStatusChange,
}: SamplesTableProps) {
	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[150px]">Sample ID</TableHead>
						<TableHead className="min-w-[200px]">Customer</TableHead>
						<TableHead className="w-[120px]">User Type</TableHead>
						<TableHead className="min-w-[200px]">Service</TableHead>
						<TableHead className="w-[150px]">Status</TableHead>
						<TableHead className="w-[120px] text-right">Created</TableHead>
						<TableHead className="w-[120px] text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((row) => (
						<TableRow key={row.id}>
							<TableCell className="font-medium">
								{row.sampleIdentifier}
							</TableCell>
							<TableCell>{row.customerName}</TableCell>
							<TableCell>
								<span className="text-muted-foreground text-sm">
									{row.userType}
								</span>
							</TableCell>
							<TableCell>{row.serviceName}</TableCell>
							<TableCell>
								<StatusCell
									currentStatus={row.status}
									onChange={onStatusChange}
									sampleId={row.id}
								/>
							</TableCell>
							<TableCell className="text-right text-muted-foreground text-sm">
								{format(new Date(row.createdAt), "MMM d, yyyy")}
							</TableCell>
							<TableCell className="text-right">
								<div className="flex justify-end gap-1">
									<RouterButton
										href={`/admin/bookings/${row.bookingId}`}
										size="icon"
										title="View booking"
										variant="ghost"
									>
										<Eye className="size-4" />
									</RouterButton>
								</div>
							</TableCell>
						</TableRow>
					))}
					{isLoading && rows.length === 0 && (
						<TableRow>
							<TableCell className="py-8 text-center text-gray-500" colSpan={7}>
								Loading samples...
							</TableCell>
						</TableRow>
					)}
					{!isLoading && rows.length === 0 && (
						<TableRow>
							<TableCell className="py-8 text-center text-gray-500" colSpan={7}>
								No samples found
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
