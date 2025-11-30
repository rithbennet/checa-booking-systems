"use client";

import { AlertCircle, Banknote, Clock, Loader2, Receipt } from "lucide-react";
import { useMemo } from "react";
import { useUserFinancials } from "@/entities/booking";
import {
    formatAmount,
    getFinancialsColumns,
} from "@/features/finance/user-financials";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/shared/ui/shadcn/card";
import { DataTable } from "@/shared/ui/table";

export default function FinancialsPage() {
    const { data, isLoading, error } = useUserFinancials();

    const columns = useMemo(() => getFinancialsColumns(), []);

    if (isLoading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-2 text-muted-foreground">
                <AlertCircle className="size-8" />
                <p>Failed to load financial data. Please try again.</p>
            </div>
        );
    }

    const { items, summary } = data;

    return (
        <div className="space-y-6 p-6">
            {/* Page Header */}
            <div>
                <h1 className="font-bold text-2xl text-slate-900">Financials</h1>
                <p className="text-muted-foreground text-sm">
                    View your invoices and manage payments
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="font-medium text-sm">
                            Total Outstanding
                        </CardTitle>
                        <Banknote className="size-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="font-bold text-2xl text-red-600">
                            {formatAmount(summary.totalOutstanding)}
                        </div>
                        <p className="text-muted-foreground text-xs">
                            Unpaid or rejected payments
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="font-medium text-sm">
                            Pending Verification
                        </CardTitle>
                        <Clock className="size-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="font-bold text-2xl text-yellow-600">
                            {formatAmount(summary.totalPending)}
                        </div>
                        <p className="text-muted-foreground text-xs">
                            Awaiting admin verification
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="font-medium text-sm">Total Paid</CardTitle>
                        <Receipt className="size-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="font-bold text-2xl text-green-600">
                            {formatAmount(summary.totalPaid)}
                        </div>
                        <p className="text-muted-foreground text-xs">
                            Successfully verified payments
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Invoices Table */}
            <div className="space-y-4">
                <h2 className="font-semibold text-lg">Your Invoices</h2>
                <DataTable
                    columns={columns}
                    data={items}
                    emptyMessage="No invoices found"
                    emptyState={
                        <div className="flex flex-col items-center gap-2 py-8 text-center">
                            <Receipt className="size-12 text-muted-foreground/50" />
                            <p className="text-muted-foreground">
                                You don't have any invoices yet.
                            </p>
                            <p className="text-muted-foreground text-sm">
                                Invoices will appear here once your bookings are processed.
                            </p>
                        </div>
                    }
                    getRowId={(row) => row.id}
                    isLoading={false}
                />
            </div>
        </div>
    );
}
