/**
 * Finance feature helpers
 * Formatting and helper functions for finance UI
 */

import type {
	form_status_enum,
	payment_method_enum,
	payment_status_enum,
} from "generated/prisma";
import type {
	FormsStatusLabel,
	PaymentStatusLabel,
} from "@/entities/booking/server/finance-repository";

// ==============================================================
// Currency Formatting
// ==============================================================

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

export function getPaymentStatusLabel(
	status: PaymentStatusLabel | payment_status_enum,
): string {
	const labels: Record<string, string> = {
		no_receipt: "No Receipt",
		pending_verification: "Pending Verification",
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
		pending_verification: "bg-blue-100 text-blue-800",
		paid: "bg-green-100 text-green-800",
		rejected: "bg-red-100 text-red-800",
		pending: "bg-blue-100 text-blue-800",
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

export function getServiceFormStatusLabel(
	status: form_status_enum | "verified",
): string {
	const labels: Record<string, string> = {
		generated: "Generated",
		downloaded: "Downloaded",
		signed_forms_uploaded: "Pending Review",
		verified: "Verified",
		expired: "Expired",
	};
	return labels[status] ?? status;
}

export function getServiceFormStatusBadgeClass(
	status: form_status_enum | "verified",
): string {
	const classes: Record<string, string> = {
		generated: "bg-gray-100 text-gray-700",
		downloaded: "bg-blue-100 text-blue-800",
		signed_forms_uploaded: "bg-blue-100 text-blue-800",
		verified: "bg-green-100 text-green-800",
		expired: "bg-red-100 text-red-800",
	};
	return classes[status] ?? "bg-gray-100 text-gray-700";
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
