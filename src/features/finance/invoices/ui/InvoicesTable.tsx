"use client";

import { Eye, FileText, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import type { InvoiceListVM } from "@/entities/invoice/server/repository";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/ui/shadcn/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { type ColumnDef, DataTable } from "@/shared/ui/table";
import {
	formatCurrencyCompact,
	formatDate,
	getDaysUntilDue,
	getInvoiceStatusBadgeClass,
	getInvoiceStatusLabel,
	getUserTypeBadgeClass,
	getUserTypeLabel,
} from "../../lib/helpers";

interface InvoicesTableProps {
	data: InvoiceListVM[];
	isLoading: boolean;
	onViewPdf?: (invoice: InvoiceListVM) => void;
	onEditDueDate?: (invoice: InvoiceListVM) => void;
	onRecordPayment?: (invoice: InvoiceListVM) => void;
}

export function InvoicesTable({
	data,
	isLoading,
	onViewPdf,
	onEditDueDate,
	onRecordPayment,
}: InvoicesTableProps) {
	const columns: ColumnDef<InvoiceListVM>[] = useMemo(
		() => [
			{
				id: "invoiceNumber",
				header: "Invoice No",
				className: "w-[130px]",
				cell: ({ row }) => (
					<span className="font-mono text-sm">{row.invoiceNumber}</span>
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
				id: "invoiceDate",
				header: "Invoice Date",
				className: "w-[110px]",
				cell: ({ row }) => (
					<span className="text-sm">{formatDate(row.invoiceDate)}</span>
				),
			},
			{
				id: "dueDate",
				header: "Due Date",
				className: "w-[130px]",
				cell: ({ row }) => {
					const daysUntilDue = getDaysUntilDue(row.dueDate);
					const isPastDue = row.isOverdue;

					return (
						<div>
							<span className={isPastDue ? "font-medium text-red-600" : ""}>
								{formatDate(row.dueDate)}
							</span>
							{isPastDue && (
								<div className="text-red-600 text-xs">
									{Math.abs(daysUntilDue)} days overdue
								</div>
							)}
							{!isPastDue && daysUntilDue <= 7 && daysUntilDue >= 0 && (
								<div className="text-xs text-yellow-600">
									Due in {daysUntilDue} days
								</div>
							)}
						</div>
					);
				},
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
				id: "status",
				header: "Status",
				className: "w-[100px]",
				cell: ({ row }) => (
					<Badge
						className={getInvoiceStatusBadgeClass(row.status, row.isOverdue)}
						variant="secondary"
					>
						{row.isOverdue &&
						row.status !== "paid" &&
						row.status !== "cancelled"
							? "Overdue"
							: getInvoiceStatusLabel(row.status)}
					</Badge>
				),
			},
			{
				id: "paidBalance",
				header: "Paid / Balance",
				className: "w-[150px]",
				cell: ({ row }) => {
					const totalPaid = parseFloat(row.totalPaid);
					const balance = parseFloat(row.balance);

					return (
						<div className="text-sm">
							<span className="text-green-600">
								{formatCurrencyCompact(totalPaid)}
							</span>
							{balance > 0 && (
								<span className="text-muted-foreground">
									{" / "}
									<span className="text-orange-600">
										{formatCurrencyCompact(balance)}
									</span>
								</span>
							)}
						</div>
					);
				},
			},
			{
				id: "actions",
				header: "Actions",
				className: "w-[100px]",
				align: "right",
				cell: ({ row }) => (
					<div className="flex justify-end gap-1">
						{onViewPdf && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										onClick={() => onViewPdf(row)}
										size="icon"
										variant="ghost"
									>
										<FileText className="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>View PDF</TooltipContent>
							</Tooltip>
						)}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button size="icon" variant="ghost">
									<MoreHorizontal className="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem asChild>
									<Link href={`/admin/bookings/${row.bookingId}`}>
										<Eye className="mr-2 size-4" />
										Open Booking
									</Link>
								</DropdownMenuItem>
								{onRecordPayment &&
									row.status !== "paid" &&
									row.status !== "cancelled" && (
										<DropdownMenuItem onClick={() => onRecordPayment(row)}>
											Record Manual Payment
										</DropdownMenuItem>
									)}
								{onEditDueDate &&
									row.status !== "paid" &&
									row.status !== "cancelled" && (
										<DropdownMenuItem onClick={() => onEditDueDate(row)}>
											Edit Due Date
										</DropdownMenuItem>
									)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				),
			},
		],
		[onViewPdf, onEditDueDate, onRecordPayment],
	);

	return (
		<DataTable
			columns={columns}
			data={data}
			emptyMessage="No invoices found"
			getRowId={(row) => row.id}
			isLoading={isLoading}
			skeletonRowCount={10}
		/>
	);
}
