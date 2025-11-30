/**
 * User Results Feature - Column Definitions
 * DataTable column configuration for the user results page
 */

import Link from "next/link";
import type { UserSampleResultRow } from "@/entities/sample-tracking/model/types";
import { SampleStatusBadge } from "@/entities/sample-tracking/ui/StatusBadge";
import type { ColumnDef } from "@/shared/ui/table/types";
import { ResultActionCell } from "./ResultActionCell";

/**
 * Get column definitions for user results table
 */
export function getUserResultsColumns(): ColumnDef<UserSampleResultRow>[] {
	return [
		{
			id: "sampleId",
			header: "Sample ID",
			cell: ({ row }) => (
				<span className="font-medium text-slate-900">
					{row.sampleIdentifier}
				</span>
			),
			className: "w-[140px]",
		},
		{
			id: "service",
			header: "Service / Test",
			cell: ({ row }) => (
				<span className="text-slate-700">{row.serviceName}</span>
			),
			className: "min-w-[180px]",
		},
		{
			id: "status",
			header: "Status",
			cell: ({ row }) => <SampleStatusBadge status={row.status} />,
			className: "w-[140px]",
		},
		{
			id: "bookingRef",
			header: "Booking Ref",
			cell: ({ row }) => (
				<Link
					className="text-blue-600 hover:text-blue-800 hover:underline"
					href={`/dashboard/bookings/${row.bookingId}`}
				>
					{row.bookingRef}
				</Link>
			),
			className: "w-[130px]",
		},
		{
			id: "actions",
			header: "Result / Actions",
			cell: ({ row }) => <ResultActionCell sample={row} />,
			align: "right",
			className: "w-[200px]",
		},
	];
}
