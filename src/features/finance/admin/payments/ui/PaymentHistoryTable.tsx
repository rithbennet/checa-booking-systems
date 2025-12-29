"use client";

import { Eye, FileText } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import type { PaymentHistoryVM } from "@/entities/payment/model/types";
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
	formatDate,
	getPaymentMethodLabel,
	getPaymentStatusBadgeClass,
	getPaymentStatusLabel,
	getUserTypeBadgeClass,
	getUserTypeLabel,
} from "../../../lib/helpers";

interface PaymentHistoryTableProps {
	data: PaymentHistoryVM[];
	isLoading: boolean;
	onViewReceipt?: (payment: PaymentHistoryVM) => void;
}

export function PaymentHistoryTable({
	data,
	isLoading,
	onViewReceipt,
}: PaymentHistoryTableProps) {
	const columns: ColumnDef<PaymentHistoryVM>[] = useMemo(
		() => [
			{
				id: "formNumber",
				header: "Form No",
				className: "w-[130px]",
				cell: ({ row }) => (
					<span className="font-mono text-sm">{row.formNumber}</span>
				),
			},
			{
				id: "booking",
				header: "Booking Ref",
				className: "w-[140px]",
				cell: ({ row }) => (
					<Link
						className="font-mono text-blue-600 text-sm hover:underline"
						href={`/admin/bookings/${row.bookingId}`}
					>
						{row.bookingRef}
					</Link>
				),
			},
			{
				id: "client",
				header: "Client",
				className: "min-w-[160px]",
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
					</div>
				),
			},
			{
				id: "method",
				header: "Method",
				className: "w-[130px]",
				cell: ({ row }) => (
					<span className="text-sm">
						{getPaymentMethodLabel(row.paymentMethod)}
					</span>
				),
			},
			{
				id: "amount",
				header: "Amount",
				className: "w-[110px]",
				align: "right",
				cell: ({ row }) => (
					<span className="font-medium">
						{formatCurrencyCompact(row.amount)}
					</span>
				),
			},
			{
				id: "paymentDate",
				header: "Payment Date",
				className: "w-[110px]",
				cell: ({ row }) => (
					<span className="text-sm">{formatDate(row.paymentDate)}</span>
				),
			},
			{
				id: "status",
				header: "Status",
				className: "w-[100px]",
				cell: ({ row }) => (
					<Badge
						className={getPaymentStatusBadgeClass(row.status)}
						variant="secondary"
					>
						{getPaymentStatusLabel(row.status)}
					</Badge>
				),
			},
			{
				id: "verifiedBy",
				header: "Processed By",
				className: "w-[140px]",
				cell: ({ row }) => (
					<div className="text-sm">
						{row.verifiedBy ? (
							<>
								<div>{row.verifiedBy.name}</div>
								<div className="text-muted-foreground text-xs">
									{formatDate(row.processedAt)}
								</div>
							</>
						) : (
							<span className="text-muted-foreground">-</span>
						)}
					</div>
				),
			},
			{
				id: "notes",
				header: "Notes",
				className: "min-w-[150px]",
				cell: ({ row }) => (
					<span className="text-muted-foreground text-sm">
						{row.verificationNotes || "-"}
					</span>
				),
			},
			{
				id: "actions",
				header: "Actions",
				className: "w-[80px]",
				align: "right",
				cell: ({ row }) => (
					<div className="flex justify-end gap-1">
						{onViewReceipt && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										onClick={() => onViewReceipt(row)}
										size="icon"
										variant="ghost"
									>
										<FileText className="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>View Receipt</TooltipContent>
							</Tooltip>
						)}
						<Tooltip>
							<TooltipTrigger asChild>
								<Button asChild size="icon" variant="ghost">
									<Link href={`/admin/bookings/${row.bookingId}`}>
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
		[onViewReceipt],
	);

	return (
		<DataTable
			columns={columns}
			data={data}
			emptyMessage="No payment history"
			getRowId={(row) => row.id}
			isLoading={isLoading}
			skeletonRowCount={10}
		/>
	);
}
