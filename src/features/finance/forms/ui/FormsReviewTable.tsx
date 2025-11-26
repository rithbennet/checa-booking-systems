"use client";

import { ExternalLink, Eye, FileText } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import type { ServiceFormListVM } from "@/entities/service-form/model/types";
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
	getServiceFormStatusBadgeClass,
	getServiceFormStatusLabel,
	getUserTypeBadgeClass,
	getUserTypeLabel,
} from "../../lib/helpers";

interface FormsReviewTableProps {
	data: ServiceFormListVM[];
	isLoading: boolean;
	onViewForm?: (form: ServiceFormListVM) => void;
}

export function FormsReviewTable({
	data,
	isLoading,
	onViewForm,
}: FormsReviewTableProps) {
	const columns: ColumnDef<ServiceFormListVM>[] = useMemo(
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
				id: "amount",
				header: "Amount",
				className: "w-[120px]",
				align: "right",
				cell: ({ row }) => (
					<span className="font-medium">
						{formatCurrencyCompact(row.totalAmount)}
					</span>
				),
			},
			{
				id: "validUntil",
				header: "Valid Until",
				className: "w-[120px]",
				cell: ({ row }) => (
					<div>
						<span className={row.isExpired ? "text-red-600" : ""}>
							{formatDate(row.validUntil)}
						</span>
						{row.isExpired && (
							<div className="text-red-600 text-xs">Expired</div>
						)}
					</div>
				),
			},
			{
				id: "documents",
				header: "Uploaded Docs",
				className: "w-[160px]",
				cell: ({ row }) => (
					<div className="flex flex-wrap gap-1">
						{row.hasSignedForm && (
							<Badge
								className="bg-green-100 text-green-800"
								variant="secondary"
							>
								Service Form
							</Badge>
						)}
						{row.requiresWorkingAreaAgreement && row.hasSignedWorkspaceForm && (
							<Badge
								className="bg-green-100 text-green-800"
								variant="secondary"
							>
								Workspace Form
							</Badge>
						)}
						{row.requiresWorkingAreaAgreement &&
							!row.hasSignedWorkspaceForm && (
								<Badge
									className="bg-yellow-100 text-yellow-800"
									variant="secondary"
								>
									Missing Workspace
								</Badge>
							)}
					</div>
				),
			},
			{
				id: "status",
				header: "Status",
				className: "w-[130px]",
				cell: ({ row }) => (
					<Badge
						className={getServiceFormStatusBadgeClass(row.status)}
						variant="secondary"
					>
						{getServiceFormStatusLabel(row.status)}
					</Badge>
				),
			},
			{
				id: "invoice",
				header: "Invoice",
				className: "w-[130px]",
				cell: ({ row }) => (
					<span className="text-sm">
						{row.hasInvoice ? (
							<span className="text-green-600">{row.invoiceNumber}</span>
						) : (
							<span className="text-muted-foreground">Not issued</span>
						)}
					</span>
				),
			},
			{
				id: "actions",
				header: "Actions",
				className: "w-[100px]",
				align: "right",
				cell: ({ row }) => (
					<div className="flex justify-end gap-1">
						{onViewForm && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										onClick={() => onViewForm(row)}
										size="icon"
										variant="ghost"
									>
										<FileText className="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>View Forms</TooltipContent>
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
		[onViewForm],
	);

	return (
		<DataTable
			columns={columns}
			data={data}
			emptyMessage="No forms awaiting review"
			getRowId={(row) => row.id}
			isLoading={isLoading}
			skeletonRowCount={10}
		/>
	);
}
