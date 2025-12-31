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

	// Threshold for overdue payments (in milliseconds)
	const OVERDUE_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

	// Count overdue payments from bookings with unverified payment receipts
	const overduePayments = await db.bookingRequest.count({
		where: {
			status: {
				in: ["approved", "in_progress", "completed"],
			},
			createdAt: {
				lt: new Date(Date.now() - OVERDUE_THRESHOLD_MS),
			},
			bookingDocuments: {
				none: {
					type: "payment_receipt",
					verificationStatus: "verified",
				},
			},
		},
	});

	// Calculate total revenue for current month from verified payment receipts
	const revenueAggregate = await db.bookingRequest.aggregate({
		_sum: {
			totalAmount: true,
		},
		where: {
			createdAt: {
				gte: startOfMonth,
			},
			bookingDocuments: {
				some: {
					type: "payment_receipt",
					verificationStatus: "verified",
				},
			},
		},
	});

	const totalRevenue = Number(revenueAggregate._sum.totalAmount ?? 0);

	return {
		pendingVerifications,
		pendingApprovals,
		overduePayments,
		activeBookings,
		completedThisMonth,
		totalRevenue,
	};
}
