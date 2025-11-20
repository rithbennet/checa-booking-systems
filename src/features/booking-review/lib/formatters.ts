import type { booking_status_enum } from "generated/prisma";

export function formatStatus(status: booking_status_enum): string {
	const statusMap: Record<booking_status_enum, string> = {
		draft: "Draft",
		pending_user_verification: "Pending Verification",
		pending_approval: "Pending Approval",
		revision_requested: "Revision Requested",
		approved: "Approved",
		rejected: "Rejected",
		in_progress: "In Progress",
		completed: "Completed",
		cancelled: "Cancelled",
	};
	return statusMap[status];
}

export function formatCurrency(amount: string | number): string {
	const num = typeof amount === "string" ? parseFloat(amount) : amount;
	return new Intl.NumberFormat("en-MY", {
		style: "currency",
		currency: "MYR",
	}).format(num);
}

export function formatDate(date: string | Date): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return new Intl.DateTimeFormat("en-MY", {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(d);
}

export function formatDateTime(date: string | Date): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return new Intl.DateTimeFormat("en-MY", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(d);
}
