"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import type { FinanceOverviewVM } from "@/entities/booking/server/finance-repository";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { type ColumnDef, DataTable } from "@/shared/ui/table";
import {
	formatCurrencyCompact,
	getFormsStatusBadgeClass,
	getFormsStatusLabel,
	getGateStatusBadgeClass,
	getGateStatusLabel,
	getPaymentStatusBadgeClass,
	getPaymentStatusLabel,
	getUserTypeBadgeClass,
	getUserTypeLabel,
} from "../../../lib/helpers";

interface FinanceOverviewTableProps {
	data: FinanceOverviewVM[];
	isLoading: boolean;
}

export function FinanceOverviewTable({
	data,
	isLoading,
}: FinanceOverviewTableProps) {
	const columns: ColumnDef<FinanceOverviewVM>[] = useMemo(
		() => [
			{
				id: "booking",
				header: "Booking Ref",
				className: "w-[140px]",
				cell: ({ row }) => (
					<Link
						className="font-mono text-blue-600 text-sm hover:underline"
						href={`/admin/bookings/${row.id}`}
					>
						{row.referenceNumber}
					</Link>
				),
			},
			{
				id: "client",
				header: "Client",
				className: "min-w-[180px]",
				cell: ({ row }) => (
					<div>
						<div className="flex items-center gap-2">
							<span className="font-medium">{row.client.name}</span>
							<Badge
								className={getUserTypeBadgeClass(row.client.userType)}
								variant="secondary"
							>
								{getUserTypeLabel(row.client.userType)}
							</Badge>
						</div>
						{row.organization && (
							<div className="text-muted-foreground text-xs">
								{row.organization}
							</div>
						)}
					</div>
				),
			},
			{
				id: "forms",
				header: "Forms",
				className: "w-[140px]",
				cell: ({ row }) => (
					<Tooltip>
						<TooltipTrigger asChild>
							<Badge
								className={getFormsStatusBadgeClass(row.formsStatus)}
								variant="secondary"
							>
								{getFormsStatusLabel(row.formsStatus)}
							</Badge>
						</TooltipTrigger>
						<TooltipContent>
							<div className="space-y-1 text-xs">
								<div>
									Service Form:{" "}
									{row.hasServiceFormSigned ? "✓ Signed" : "✗ Not signed"}
								</div>
								{row.requiresWorkspaceForm && (
									<div>
										Workspace Form:{" "}
										{row.hasWorkspaceFormSigned ? "✓ Signed" : "✗ Not signed"}
									</div>
								)}
							</div>
						</TooltipContent>
					</Tooltip>
				),
			},
			{
				id: "amount",
				header: "Total Amount",
				className: "w-[130px]",
				align: "right",
				cell: ({ row }) => (
					<span className="font-medium">
						{formatCurrencyCompact(row.totalAmount)}
					</span>
				),
			},
			{
				id: "payment",
				header: "Payment",
				className: "w-[150px]",
				cell: ({ row }) => {
					const totalAmount = parseFloat(row.totalAmount);
					const totalPaid = parseFloat(row.totalVerifiedPaid);

					if (totalAmount === 0 && totalPaid === 0) {
						return <span className="text-muted-foreground text-sm">-</span>;
					}

					return (
						<div className="space-y-1">
							<Badge
								className={getPaymentStatusBadgeClass(
									row.latestPaymentStatusLabel,
								)}
								variant="secondary"
							>
								{getPaymentStatusLabel(row.latestPaymentStatusLabel)}
							</Badge>
							{totalPaid > 0 && (
								<div className="text-xs">
									Paid: {formatCurrencyCompact(totalPaid)}
								</div>
							)}
						</div>
					);
				},
			},
			{
				id: "gate",
				header: "Gate",
				headerTooltip:
					"Results access gate - unlocked when payment is verified",
				className: "w-[100px]",
				align: "center",
				cell: ({ row }) => (
					<Badge
						className={getGateStatusBadgeClass(row.resultsUnlocked)}
						variant="secondary"
					>
						{getGateStatusLabel(row.resultsUnlocked)}
					</Badge>
				),
			},
			{
				id: "actions",
				header: "Actions",
				className: "w-[100px]",
				align: "right",
				cell: ({ row }) => (
					<div className="flex justify-end gap-1">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button asChild size="icon" variant="ghost">
									<Link href={`/admin/bookings/${row.id}`}>
										<Eye className="size-4" />
									</Link>
								</Button>
							</TooltipTrigger>
							<TooltipContent>Open Booking</TooltipContent>
						</Tooltip>
					</div>
				),
			},
		],
		[],
	);

	return (
		<DataTable
			columns={columns}
			data={data}
			emptyMessage="No bookings found"
			getRowId={(row) => row.id}
			isLoading={isLoading}
			skeletonRowCount={10}
		/>
	);
}
