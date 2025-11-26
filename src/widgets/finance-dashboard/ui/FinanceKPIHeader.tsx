/**
 * Finance KPI Header
 *
 * Displays key financial metrics at a glance:
 * - Total Outstanding Amount
 * - Overdue Amount
 * - Pending Form Reviews
 * - Pending Payment Verifications
 */

"use client";

import {
	AlertTriangle,
	Clock,
	DollarSign,
	FileCheck,
} from "lucide-react";
import { useFinanceStats } from "@/entities/booking/api/useFinanceStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/shadcn/card";
import { Skeleton } from "@/shared/ui/shadcn/skeleton";

interface KPICardProps {
	title: string;
	value: string | number;
	icon: React.ReactNode;
	description?: string;
	variant?: "default" | "warning" | "danger";
}

function KPICard({ title, value, icon, description, variant = "default" }: KPICardProps) {
	const variantStyles = {
		default: "bg-card",
		warning: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800",
		danger: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
	};

	const iconStyles = {
		default: "text-muted-foreground",
		warning: "text-amber-600 dark:text-amber-400",
		danger: "text-red-600 dark:text-red-400",
	};

	return (
		<Card className={variantStyles[variant]}>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="font-medium text-sm">{title}</CardTitle>
				<div className={iconStyles[variant]}>{icon}</div>
			</CardHeader>
			<CardContent>
				<div className="font-bold text-2xl">{value}</div>
				{description && (
					<p className="text-muted-foreground text-xs">{description}</p>
				)}
			</CardContent>
		</Card>
	);
}

function KPICardSkeleton() {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-4 w-4 rounded" />
			</CardHeader>
			<CardContent>
				<Skeleton className="h-8 w-32" />
				<Skeleton className="mt-2 h-3 w-20" />
			</CardContent>
		</Card>
	);
}

export function FinanceKPIHeader() {
	const { data: stats, isLoading, error } = useFinanceStats();

	if (isLoading) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<KPICardSkeleton />
				<KPICardSkeleton />
				<KPICardSkeleton />
				<KPICardSkeleton />
			</div>
		);
	}

	if (error || !stats) {
		return (
			<div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
				<p className="text-red-600 text-sm dark:text-red-400">
					Failed to load financial statistics
				</p>
			</div>
		);
	}

	// Determine if amounts are concerning
	const hasOverdue = parseFloat(stats.overdueAmount.replace(/[^0-9.-]/g, "")) > 0;
	const hasPendingPayments = stats.pendingPaymentVerifications > 0;

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<KPICard
				description="Across all active invoices"
				icon={<DollarSign className="h-4 w-4" />}
				title="Total Outstanding"
				value={stats.totalOutstanding}
			/>
			<KPICard
				description="Past due date"
				icon={<AlertTriangle className="h-4 w-4" />}
				title="Overdue Amount"
				value={stats.overdueAmount}
				variant={hasOverdue ? "danger" : "default"}
			/>
			<KPICard
				description="Service forms awaiting admin review"
				icon={<FileCheck className="h-4 w-4" />}
				title="Pending Form Reviews"
				value={stats.pendingFormReviews}
				variant={stats.pendingFormReviews > 0 ? "warning" : "default"}
			/>
			<KPICard
				description="Payment receipts to verify"
				icon={<Clock className="h-4 w-4" />}
				title="Pending Verifications"
				value={stats.pendingPaymentVerifications}
				variant={hasPendingPayments ? "warning" : "default"}
			/>
		</div>
	);
}
