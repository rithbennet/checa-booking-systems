/**
 * User Financials Feature - Helpers
 * Formatting and helper functions for user financials UI
 */

import type { UserPaymentStatus } from "@/entities/booking/server/user-financials-repository";

// ==============================================================
// Date Formatting
// ==============================================================

export function formatFinancialDate(
	dateStr: string | null | undefined,
): string {
	if (!dateStr) return "-";
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-MY", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

// ==============================================================
// Currency Formatting
// ==============================================================

export function formatAmount(amount: string | number): string {
	const num = typeof amount === "string" ? parseFloat(amount) : amount;
	return `RM ${num.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ==============================================================
// Status Labels & Badge Classes
// ==============================================================

export function getUserPaymentStatusLabel(status: UserPaymentStatus): string {
	const labels: Record<UserPaymentStatus, string> = {
		unpaid: "Unpaid",
		pending_verification: "Verifying",
		verified: "Paid",
		rejected: "Rejected",
	};
	return labels[status];
}

export function getUserPaymentStatusBadgeVariant(
	status: UserPaymentStatus,
): "default" | "secondary" | "destructive" | "outline" {
	const variants: Record<
		UserPaymentStatus,
		"default" | "secondary" | "destructive" | "outline"
	> = {
		unpaid: "destructive",
		pending_verification: "secondary",
		verified: "default",
		rejected: "destructive",
	};
	return variants[status];
}

export function getUserPaymentStatusClassName(
	status: UserPaymentStatus,
): string {
	const classes: Record<UserPaymentStatus, string> = {
		unpaid: "bg-red-100 text-red-800",
		pending_verification: "bg-yellow-100 text-yellow-800",
		verified: "bg-green-100 text-green-800",
		rejected: "bg-red-100 text-red-800",
	};
	return classes[status];
}

// ==============================================================
// Invoice Reference Formatting
// ==============================================================

export function formatInvoiceRef(invoiceNumber: string): string {
	return invoiceNumber;
}
