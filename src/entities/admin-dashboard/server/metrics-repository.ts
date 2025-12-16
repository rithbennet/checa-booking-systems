/**
 * Admin Dashboard Metrics Repository
 * Computes metrics for the admin dashboard
 */

import { db } from "@/shared/server/db";
import type { AdminDashboardMetricsVM } from "../model/types";

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetricsVM> {
	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

	// Count pending user verifications (users with status 'pending')
	const pendingVerifications = await db.user.count({
		where: {
			status: "pending",
		},
	});

	// Count bookings pending approval
	const pendingApprovals = await db.bookingRequest.count({
		where: {
			status: "pending_approval",
		},
	});

	// Count active bookings (approved or in_progress)
	const activeBookings = await db.bookingRequest.count({
		where: {
			status: {
				in: ["approved", "in_progress"],
			},
		},
	});

	// Count completed bookings this month
	const completedThisMonth = await db.bookingRequest.count({
		where: {
			status: "completed",
			createdAt: {
				gte: startOfMonth,
			},
		},
	});

	// Count overdue payments (invoices with status 'overdue' or past due date)
	const overdueInvoices = await db.invoice.findMany({
		where: {
			status: {
				in: ["pending", "sent", "overdue"],
			},
			dueDate: {
				lt: now,
			},
		},
		include: {
			payments: {
				where: {
					status: "verified",
				},
			},
		},
	});

	let overduePayments = 0;
	for (const invoice of overdueInvoices) {
		const totalPaid = invoice.payments.reduce(
			(sum, p) => sum + Number(p.amount),
			0,
		);
		const balance = Number(invoice.amount) - totalPaid;
		if (balance > 0) {
			overduePayments++;
		}
	}

	// Calculate total revenue for current month (from verified payments)
	const monthlyPayments = await db.payment.findMany({
		where: {
			status: "verified",
			paymentDate: {
				gte: startOfMonth,
			},
		},
		select: {
			amount: true,
		},
	});

	const totalRevenue = monthlyPayments.reduce(
		(sum, p) => sum + Number(p.amount),
		0,
	);

	return {
		pendingVerifications,
		pendingApprovals,
		overduePayments,
		activeBookings,
		completedThisMonth,
		totalRevenue,
	};
}
