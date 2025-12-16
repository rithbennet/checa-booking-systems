/**
 * Admin Dashboard Activity Repository
 * Fetches recent activity for the admin dashboard from AuditLog
 */

import { db } from "@/shared/server/db";
import type {
	AdminDashboardActivityItemVM,
	AdminDashboardActivityVM,
} from "../model/types";

export async function getAdminDashboardActivity(): Promise<AdminDashboardActivityVM> {
	const limit = 10;
	const now = new Date();
	const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

	// Query AuditLog for relevant activity actions
	const auditLogs = await db.auditLog.findMany({
		where: {
			createdAt: {
				gte: oneDayAgo,
			},
			action: {
				in: [
					// User actions
					"user.registered",
					"user.approved",
					// Booking actions
					"booking.approve",
					"booking.reject",
					"booking.return_for_revision",
					// Payment actions
					"upload_payment_proof",
					"payment.verified",
					"payment.rejected",
					// Document actions
					"document_uploaded",
					// Sample actions
					"analysis_result_deleted",
					// Modification actions
					"modification_approved",
					"modification_rejected",
					// Form actions
					"VERIFY_SIGNATURE",
				],
			},
		},
		orderBy: { createdAt: "desc" },
		take: limit * 2, // Get more to filter and format
		include: {
			user: {
				select: {
					firstName: true,
					lastName: true,
				},
			},
		},
	});

	// Map audit logs to activity items
	const activities: AdminDashboardActivityItemVM[] = auditLogs
		.map((log) => {
			const metadata = (log.metadata as Record<string, unknown>) || {};
			const userName = log.user
				? `${log.user.firstName} ${log.user.lastName}`.trim()
				: "User";

			// Map actions to activity items
			switch (log.action) {
				case "user.registered":
				case "user.approved":
					return {
						id: log.id,
						type: "user" as const,
						action: `User ${userName} ${log.action === "user.approved" ? "approved" : "registered"}`,
						timestamp: formatTimestamp(log.createdAt),
					};

				case "booking.approve":
					return {
						id: log.id,
						type: "booking" as const,
						action: `Booking #${metadata.bookingReference || log.entityId} approved by Admin`,
						timestamp: formatTimestamp(log.createdAt),
					};

				case "booking.reject":
					return {
						id: log.id,
						type: "booking" as const,
						action: `Booking #${metadata.bookingReference || log.entityId} rejected`,
						timestamp: formatTimestamp(log.createdAt),
					};

				case "booking.return_for_revision":
					return {
						id: log.id,
						type: "booking" as const,
						action: `Booking #${metadata.bookingReference || log.entityId} returned for revision`,
						timestamp: formatTimestamp(log.createdAt),
					};

				case "upload_payment_proof":
					return {
						id: log.id,
						type: "payment" as const,
						action: `Payment proof uploaded for Invoice #${metadata.invoiceNumber || log.entityId}`,
						timestamp: formatTimestamp(log.createdAt),
					};

				case "payment.verified":
					return {
						id: log.id,
						type: "payment" as const,
						action: `Payment verified for Invoice #${metadata.invoiceNumber || log.entityId}`,
						timestamp: formatTimestamp(log.createdAt),
					};

				case "payment.rejected":
					return {
						id: log.id,
						type: "payment" as const,
						action: `Payment rejected for Invoice #${metadata.invoiceNumber || log.entityId}`,
						timestamp: formatTimestamp(log.createdAt),
					};

				case "document_uploaded":
					if (metadata.documentType === "sample_result") {
						return {
							id: log.id,
							type: "sample" as const,
							action: `Results uploaded for Sample ${metadata.sampleTrackingId || ""}`,
							timestamp: formatTimestamp(log.createdAt),
						};
					}
					return null;

				case "analysis_result_deleted":
					return {
						id: log.id,
						type: "sample" as const,
						action: `Analysis result deleted for Booking #${metadata.bookingReference || log.entityId}`,
						timestamp: formatTimestamp(log.createdAt),
					};

				case "modification_approved":
				case "modification_rejected":
					return {
						id: log.id,
						type: "service" as const,
						action: `Service modification ${log.action === "modification_approved" ? "approved" : "rejected"} for Booking #${metadata.bookingReference || log.entityId}`,
						timestamp: formatTimestamp(log.createdAt),
					};

				case "VERIFY_SIGNATURE":
					return {
						id: log.id,
						type: "service" as const,
						action: `Service form signature verified for Booking #${metadata.bookingReference || log.entityId}`,
						timestamp: formatTimestamp(log.createdAt),
					};

				default:
					return null;
			}
		})
		.filter((item): item is AdminDashboardActivityItemVM => item !== null)
		.slice(0, limit); // Take top N after filtering

	return {
		items: activities,
	};
}

function formatTimestamp(date: Date): string {
	const now = new Date();
	let diffMs = now.getTime() - date.getTime();
	
	// Handle future dates gracefully
	if (diffMs < 0) {
		diffMs = 0;
		return "Just now";
	}
	
	const diffMins = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

	if (diffMins < 1) {
		return "Just now";
	}
	if (diffMins < 60) {
		return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
	}
	if (diffHours < 24) {
		return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
	}
	const diffDays = Math.floor(diffHours / 24);
	return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}
