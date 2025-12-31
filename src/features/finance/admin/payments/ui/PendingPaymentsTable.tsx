"use client";

import { Check, FileText, X } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import type { PaymentReceiptVM } from "@/entities/booking-document";
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
	getUserTypeBadgeClass,
	getUserTypeLabel,
} from "../../../lib/helpers";

interface PendingPaymentsTableProps {
	data: PaymentReceiptVM[];
	isLoading: boolean;
	onVerify: (payment: PaymentReceiptVM) => void;
	onReject: (payment: PaymentReceiptVM) => void;
	onViewReceipt?: (payment: PaymentReceiptVM) => void;
}

export function PendingPaymentsTable({
	data,
	isLoading,
	onVerify,
	onReject,
	onViewReceipt,
}: PendingPaymentsTableProps) {
	const columns: ColumnDef<PaymentReceiptVM>[] = useMemo(
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
				id: "method",
				header: "Method",
				className: "w-[140px]",
				cell: ({ row }) => (
					<span className="text-sm">
						{getPaymentMethodLabel(row.paymentMethod)}
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
				id: "amount",
				header: "Amount",
				className: "w-[120px]",
				align: "right",
				cell: ({ row }) => (
					<span className="font-medium">
						{formatCurrencyCompact(row.amount)}
					</span>
				),
			},
			{
				id: "uploadedBy",
				header: "Uploaded By",
				className: "w-[130px]",
				cell: ({ row }) => (
					<div className="text-sm">
						<div>{row.uploadedBy.name}</div>
						<div className="text-muted-foreground text-xs">
							{formatDate(row.uploadedAt)}
						</div>
					</div>
				),
			},
			{
				id: "age",
				header: "Age",
				headerTooltip: "Days since payment receipt was uploaded",
				className: "w-[80px]",
				align: "center",
				cell: ({ row }) => {
					const age = row.age ?? 0;
					return (
						<Badge
							className={
								age > 7
									? "bg-red-100 text-red-800"
									: age > 3
										? "bg-yellow-100 text-yellow-800"
										: "bg-gray-100 text-gray-700"
							}
							variant="secondary"
						>
							{age}d
						</Badge>
					);
				},
			},
			{
				id: "actions",
				header: "Actions",
				className: "w-[140px]",
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
								<Button
									className="text-green-600 hover:bg-green-50 hover:text-green-700"
									onClick={() => onVerify(row)}
									size="icon"
									variant="ghost"
								>
									<Check className="size-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Verify Payment</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									className="text-red-600 hover:bg-red-50 hover:text-red-700"
									onClick={() => onReject(row)}
									size="icon"
									variant="ghost"
								>
									<X className="size-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Reject Payment</TooltipContent>
						</Tooltip>
					</div>
				),
			},
		],
		[onVerify, onReject, onViewReceipt],
	);

	return (
		<DataTable
			columns={columns}
			data={data}
			emptyMessage="No pending payments"
			getRowId={(row) => row.id}
			isLoading={isLoading}
			skeletonRowCount={10}
		/>
	);
}
