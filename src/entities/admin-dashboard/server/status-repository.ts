/**
 * Admin Dashboard Status Repository
 * Computes status breakdowns for the admin dashboard
 */

import { db } from "@/shared/server/db";
import type { AdminDashboardStatusVM } from "../model/types";

export async function getAdminDashboardStatus(): Promise<AdminDashboardStatusVM> {
	// Count bookings by status
	const [
		pendingBookings,
		approvedBookings,
		inProgressBookings,
		completedBookings,
	] = await Promise.all([
		db.bookingRequest.count({
			where: { status: "pending_approval" },
		}),
		db.bookingRequest.count({
			where: { status: "approved" },
		}),
		db.bookingRequest.count({
			where: { status: "in_progress" },
		}),
		db.bookingRequest.count({
			where: { status: "completed" },
		}),
	]);

	// Count users by type
	const [mjiitUsers, utmUsers, externalUsers, pendingUsers] = await Promise.all(
		[
			db.user.count({
				where: { userType: "mjiit_member", status: "active" },
			}),
			db.user.count({
				where: { userType: "utm_member", status: "active" },
			}),
			db.user.count({
				where: { userType: "external_member", status: "active" },
			}),
			db.user.count({
				where: { status: "pending" },
			}),
		],
	);

	// Count active samples (in analysis)
	const activeSamples = await db.sampleTracking.count({
		where: {
			status: {
				in: ["received", "in_analysis"],
			},
		},
	});

	return {
		bookingsByStatus: {
			pending: pendingBookings,
			approved: approvedBookings,
			inProgress: inProgressBookings,
			completed: completedBookings,
		},
		usersByType: {
			mjiit: mjiitUsers,
			utm: utmUsers,
			external: externalUsers,
			pending: pendingUsers,
		},
		activeSamples,
	};
}
