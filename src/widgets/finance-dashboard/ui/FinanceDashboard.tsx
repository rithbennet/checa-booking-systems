/**
 * Admin Finance Dashboard
 *
 * Unified widget with tabs for managing financial operations:
 * - Overview: Per-booking financial status
 * - Forms: Service forms awaiting review
 * - Invoices: Invoice management
 * - Payments: Payment verification queue and history
 * - Results on Hold: Completed bookings with unpaid invoices
 */

"use client";

import { Clock, DollarSign, FileCheck, FileText, Lock } from "lucide-react";
import { useState } from "react";
import { useFinanceOverview, useResultsOnHold } from "@/entities/booking";
import { useInvoiceList } from "@/entities/invoice/api/useInvoiceList";
import {
    type PendingPaymentVM,
    usePaymentHistory,
    usePendingPayments,
    useRejectPayment,
    useVerifyPayment,
} from "@/entities/payment";
import { useServiceFormList } from "@/entities/service-form/api/useServiceFormList";
import {
    FinanceOverviewTable,
    FormsReviewTable,
    InvoicesTable,
    PaymentHistoryTable,
    PendingPaymentsTable,
    ResultsOnHoldTable,
} from "@/features/finance";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/shared/ui/shadcn/tabs";
import { FinanceKPIHeader } from "./FinanceKPIHeader";

type MainTabValue =
    | "overview"
    | "forms"
    | "invoices"
    | "payments"
    | "results-on-hold";
type PaymentSubTabValue = "pending" | "history";

export function FinanceDashboard() {
    // Tab state
    const [activeTab, setActiveTab] = useState<MainTabValue>("overview");
    const [paymentSubTab, setPaymentSubTab] =
        useState<PaymentSubTabValue>("pending");

    // Data fetching hooks
    const { data: overviewData, isLoading: overviewLoading } = useFinanceOverview(
        {
            page: 1,
            pageSize: 20,
        },
    );
    const { data: formsData, isLoading: formsLoading } = useServiceFormList({
        page: 1,
        pageSize: 20,
    });
    const { data: invoicesData, isLoading: invoicesLoading } = useInvoiceList({
        page: 1,
        pageSize: 20,
    });
    const { data: pendingPaymentsData, isLoading: pendingPaymentsLoading } =
        usePendingPayments({
            page: 1,
            pageSize: 20,
        });
    const { data: paymentHistoryData, isLoading: paymentHistoryLoading } =
        usePaymentHistory({
            page: 1,
            pageSize: 20,
        });
    const { data: resultsOnHoldData, isLoading: resultsOnHoldLoading } =
        useResultsOnHold({
            page: 1,
            pageSize: 20,
        });

    // Payment mutation hooks
    const verifyPayment = useVerifyPayment();
    const rejectPayment = useRejectPayment();

    // Handlers for payment verification/rejection
    const handleVerifyPayment = (payment: PendingPaymentVM) => {
        verifyPayment.mutate({ paymentId: payment.id });
    };

    const handleRejectPayment = (payment: PendingPaymentVM) => {
        // In a real implementation, you'd show a dialog to get the rejection reason
        const reason = prompt("Enter rejection reason:");
        if (reason) {
            rejectPayment.mutate({ paymentId: payment.id, notes: reason });
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="font-bold text-2xl tracking-tight">
                    Financial Management
                </h1>
                <p className="text-muted-foreground">
                    Manage invoices, payments, service forms, and financial reporting.
                </p>
            </div>

            {/* KPI Header */}
            <FinanceKPIHeader />

            {/* Main Tabs */}
            <Tabs
                onValueChange={(value) => setActiveTab(value as MainTabValue)}
                value={activeTab}
            >
                <TabsList className="grid w-full max-w-3xl grid-cols-5">
                    <TabsTrigger className="gap-2" value="overview">
                        <DollarSign className="size-4" />
                        <span className="hidden sm:inline">Overview</span>
                    </TabsTrigger>
                    <TabsTrigger className="gap-2" value="forms">
                        <FileCheck className="size-4" />
                        <span className="hidden sm:inline">Forms</span>
                    </TabsTrigger>
                    <TabsTrigger className="gap-2" value="invoices">
                        <FileText className="size-4" />
                        <span className="hidden sm:inline">Invoices</span>
                    </TabsTrigger>
                    <TabsTrigger className="gap-2" value="payments">
                        <Clock className="size-4" />
                        <span className="hidden sm:inline">Payments</span>
                    </TabsTrigger>
                    <TabsTrigger className="gap-2" value="results-on-hold">
                        <Lock className="size-4" />
                        <span className="hidden sm:inline">On Hold</span>
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent className="mt-6" value="overview">
                    <FinanceOverviewTable
                        data={overviewData?.items ?? []}
                        isLoading={overviewLoading}
                    />
                </TabsContent>

                {/* Forms Tab */}
                <TabsContent className="mt-6" value="forms">
                    <FormsReviewTable
                        data={formsData?.items ?? []}
                        isLoading={formsLoading}
                    />
                </TabsContent>

                {/* Invoices Tab */}
                <TabsContent className="mt-6" value="invoices">
                    <InvoicesTable
                        data={invoicesData?.items ?? []}
                        isLoading={invoicesLoading}
                    />
                </TabsContent>

                {/* Payments Tab with Sub-Tabs */}
                <TabsContent className="mt-6" value="payments">
                    <Tabs
                        onValueChange={(value) =>
                            setPaymentSubTab(value as PaymentSubTabValue)
                        }
                        value={paymentSubTab}
                    >
                        <TabsList>
                            <TabsTrigger value="pending">Pending Queue</TabsTrigger>
                            <TabsTrigger value="history">History</TabsTrigger>
                        </TabsList>

                        <TabsContent className="mt-4" value="pending">
                            <PendingPaymentsTable
                                data={pendingPaymentsData?.items ?? []}
                                isLoading={pendingPaymentsLoading}
                                onReject={handleRejectPayment}
                                onVerify={handleVerifyPayment}
                            />
                        </TabsContent>

                        <TabsContent className="mt-4" value="history">
                            <PaymentHistoryTable
                                data={paymentHistoryData?.items ?? []}
                                isLoading={paymentHistoryLoading}
                            />
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                {/* Results on Hold Tab */}
                <TabsContent className="mt-6" value="results-on-hold">
                    <ResultsOnHoldTable
                        data={resultsOnHoldData?.items ?? []}
                        isLoading={resultsOnHoldLoading}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
