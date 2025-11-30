"use client";

import type { UserFinancialVM } from "@/entities/booking/server/user-financials-repository";
import { Badge } from "@/shared/ui/shadcn/badge";
import type { ColumnDef } from "@/shared/ui/table";
import {
    formatAmount,
    formatFinancialDate,
    formatInvoiceRef,
    getUserPaymentStatusBadgeVariant,
    getUserPaymentStatusLabel,
} from "../lib/helpers";
import { FinancialsRowActions } from "./FinancialsRowActions";

export function getFinancialsColumns(): ColumnDef<UserFinancialVM>[] {
    return [
        {
            id: "invoiceNumber",
            header: "Invoice Ref",
            className: "w-[140px]",
            cell: ({ row }) => (
                <span className="font-mono text-sm">
                    {formatInvoiceRef(row.invoiceNumber)}
                </span>
            ),
        },
        {
            id: "createdAt",
            header: "Date",
            className: "w-[110px]",
            cell: ({ row }) => (
                <span className="text-sm">{formatFinancialDate(row.createdAt)}</span>
            ),
        },
        {
            id: "amount",
            header: "Amount",
            className: "w-[120px]",
            align: "right",
            cell: ({ row }) => (
                <span className="font-medium">{formatAmount(row.amount)}</span>
            ),
        },
        {
            id: "status",
            header: "Status",
            className: "w-[110px]",
            cell: ({ row }) => (
                <Badge variant={getUserPaymentStatusBadgeVariant(row.paymentStatus)}>
                    {getUserPaymentStatusLabel(row.paymentStatus)}
                </Badge>
            ),
        },
        {
            id: "actions",
            header: "Actions",
            className: "w-[160px]",
            align: "right",
            cell: ({ row }) => <FinancialsRowActions invoice={row} />,
        },
    ];
}
