/**
 * Finance feature helpers
 * Formatting and helper functions for finance UI
 */

import type {
	form_status_enum,
	invoice_status_enum,
	payment_method_enum,
	payment_status_enum,
} from "generated/prisma";
import type {
	FormsStatusLabel,
	InvoiceStatusSeverity,
	PaymentStatusLabel,
} from "@/entities/booking/server/finance-repository";

// ==============================================================
// Currency Formatting
// ==============================================================

export function formatCurrency(amount: string | number): string {
	const num = typeof amount === "string" ? parseFloat(amount) : amount;
	return new Intl.NumberFormat("en-MY", {
		style: "currency",
		currency: "MYR",
		minimumFractionDigits: 2,
	}).format(num);
}

export function formatCurrencyCompact(amount: string | number): string {
	const num = typeof amount === "string" ? parseFloat(amount) : amount;
	return `RM ${num.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ==============================================================
// Date Formatting
// ==============================================================

export function formatDate(dateStr: string | null | undefined): string {
	if (!dateStr) return "-";
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-MY", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

export function formatDateTime(dateStr: string | null | undefined): string {
	if (!dateStr) return "-";
	const date = new Date(dateStr);
	return date.toLocaleString("en-MY", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

export function getDaysUntilDue(dueDate: string): number {
	const due = new Date(dueDate);
	const now = new Date();
	const diffTime = due.getTime() - now.getTime();
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// ==============================================================
// Status Labels & Badge Classes
// ==============================================================

export function getFormsStatusLabel(status: FormsStatusLabel): string {
	const labels: Record<FormsStatusLabel, string> = {
		none: "Not Generated",
		awaiting_signature: "Awaiting Signature",
		awaiting_review: "Pending Review",
		completed: "Completed",
		expired: "Expired",
	};
	return labels[status];
}

export function getFormsStatusBadgeClass(status: FormsStatusLabel): string {
	const classes: Record<FormsStatusLabel, string> = {
		none: "bg-gray-100 text-gray-700",
		awaiting_signature: "bg-yellow-100 text-yellow-800",
		awaiting_review: "bg-blue-100 text-blue-800",
		completed: "bg-green-100 text-green-800",
		expired: "bg-red-100 text-red-800",
	};
	return classes[status];
}

export function getInvoiceStatusLabel(
	status: invoice_status_enum | InvoiceStatusSeverity | null,
): string {
	if (!status) return "No Invoice";
	const labels: Record<string, string> = {
		pending: "Pending",
		sent: "Sent",
		paid: "Paid",
		overdue: "Overdue",
		cancelled: "Cancelled",
	};
	return labels[status] ?? status;
}

export function getInvoiceStatusBadgeClass(
	status: invoice_status_enum | InvoiceStatusSeverity | null,
	isOverdue?: boolean,
): string {
	if (!status) return "bg-gray-100 text-gray-700";
	if (isOverdue && status !== "paid" && status !== "cancelled") {
		return "bg-red-100 text-red-800";
	}
	const classes: Record<string, string> = {
		pending: "bg-yellow-100 text-yellow-800",
		sent: "bg-blue-100 text-blue-800",
		paid: "bg-green-100 text-green-800",
		overdue: "bg-red-100 text-red-800",
		cancelled: "bg-gray-100 text-gray-500",
	};
	return classes[status] ?? "bg-gray-100 text-gray-700";
}

export function getPaymentStatusLabel(
	status: PaymentStatusLabel | payment_status_enum,
): string {
	const labels: Record<string, string> = {
		no_receipt: "No Receipt",
		receipt_pending: "Receipt Pending",
		paid: "Paid",
		rejected: "Rejected",
		pending: "Pending Verification",
		verified: "Verified",
	};
	return labels[status] ?? status;
}

export function getPaymentStatusBadgeClass(
	status: PaymentStatusLabel | payment_status_enum,
): string {
	const classes: Record<string, string> = {
		no_receipt: "bg-gray-100 text-gray-700",
		receipt_pending: "bg-yellow-100 text-yellow-800",
		paid: "bg-green-100 text-green-800",
		rejected: "bg-red-100 text-red-800",
		pending: "bg-yellow-100 text-yellow-800",
		verified: "bg-green-100 text-green-800",
	};
	return classes[status] ?? "bg-gray-100 text-gray-700";
}

export function getPaymentMethodLabel(method: payment_method_enum): string {
	const labels: Record<payment_method_enum, string> = {
		eft: "EFT / Bank Transfer",
		vote_transfer: "Vote Transfer",
		local_order: "Local Order",
	};
	return labels[method];
}

export function getServiceFormStatusLabel(status: form_status_enum): string {
	const labels: Record<form_status_enum, string> = {
		generated: "Generated",
		downloaded: "Downloaded",
		signed_forms_uploaded: "Signed Uploaded",
		expired: "Expired",
	};
	return labels[status];
}

export function getServiceFormStatusBadgeClass(
	status: form_status_enum,
): string {
	const classes: Record<form_status_enum, string> = {
		generated: "bg-gray-100 text-gray-700",
		downloaded: "bg-blue-100 text-blue-800",
		signed_forms_uploaded: "bg-yellow-100 text-yellow-800",
		expired: "bg-red-100 text-red-800",
	};
	return classes[status];
}

// ==============================================================
// Gate Status
// ==============================================================

export function getGateStatusLabel(unlocked: boolean): string {
	return unlocked ? "Unlocked" : "Locked";
}

export function getGateStatusBadgeClass(unlocked: boolean): string {
	return unlocked ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
}

// ==============================================================
// User Type
// ==============================================================

export function getUserTypeLabel(userType: string): string {
	const labels: Record<string, string> = {
		mjiit_member: "MJIIT",
		utm_member: "UTM",
		external_member: "External",
		lab_administrator: "Admin",
	};
	return labels[userType] ?? userType;
}

export function getUserTypeBadgeClass(userType: string): string {
	const classes: Record<string, string> = {
		mjiit_member: "bg-purple-100 text-purple-800",
		utm_member: "bg-blue-100 text-blue-800",
		external_member: "bg-orange-100 text-orange-800",
		lab_administrator: "bg-gray-100 text-gray-800",
	};
	return classes[userType] ?? "bg-gray-100 text-gray-700";
}
