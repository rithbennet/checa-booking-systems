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

	const auditLogs = await db.auditLog.findMany({
		orderBy: { createdAt: "desc" },
		take: limit,
		include: {
			user: {
				select: {
					firstName: true,
					lastName: true,
					email: true,
				},
			},
		},
	});

	const activities: AdminDashboardActivityItemVM[] = auditLogs.map((log) => {
		const metadata = (log.metadata as Record<string, unknown> | null) ?? {};
		const actor = buildActorName(log.user);
		const type = mapActivityType(log.action);
		const description = buildActivityDescription({
			action: log.action,
			metadata,
			entity: log.entity,
			entityId: log.entityId,
			actor,
		});

		return {
			id: log.id,
			type,
			action: description,
			timestamp: formatTimestamp(log.createdAt),
			actor,
			entity: log.entity,
			entityId: log.entityId,
		};
	});

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

function buildActorName(
	user?: {
		firstName: string | null;
		lastName: string | null;
		email: string | null;
	} | null,
): string | null {
	if (!user) return null;
	const parts = [user.firstName, user.lastName].filter(Boolean);
	if (parts.length > 0) {
		return parts.join(" ");
	}
	return user.email;
}

function mapActivityType(action: string): AdminDashboardActivityItemVM["type"] {
	const a = (action ?? "").toLowerCase();
	if (a.startsWith("user.")) return "user";
	if (a.startsWith("booking.")) return "booking";
	if (a.includes("payment")) return "payment";
	if (a.includes("sample") || a.includes("analysis")) return "sample";
	if (
		a.includes("service") ||
		a.includes("modification") ||
		a === "verify_signature"
	) {
		return "service";
	}
	return "other";
}

function buildActivityDescription(args: {
	action: string;
	metadata: Record<string, unknown>;
	entity?: string | null;
	entityId?: string | null;
	actor: string | null;
}): string {
	const { action, metadata, entity, entityId, actor } = args;

	// Type-safe metadata extraction
	const isValidValue = (val: unknown): val is string | number =>
		(typeof val === "string" && val.trim() !== "") || typeof val === "number";

	const bookingRefValue = metadata.bookingReference ?? entityId;
	const bookingRef = isValidValue(bookingRefValue)
		? String(bookingRefValue)
		: null;

	const invoiceNumberValue = metadata.invoiceNumber ?? entityId;
	const invoiceNumber = isValidValue(invoiceNumberValue)
		? String(invoiceNumberValue)
		: null;

	const sampleIdValue = metadata.sampleTrackingId;
	const sampleId = isValidValue(sampleIdValue) ? String(sampleIdValue) : null;

	switch (action) {
		case "user.registered":
			return actor ? `User ${actor} registered` : "User registered";
		case "user.approved":
			return actor ? `User ${actor} approved` : "User approved";
		case "booking.approve":
			return bookingRef
				? `Booking #${bookingRef} approved by Admin`
				: "Booking approved by Admin";
		case "booking.reject":
			return bookingRef
				? `Booking #${bookingRef} rejected`
				: "Booking rejected";
		case "booking.return_for_revision":
			return bookingRef
				? `Booking #${bookingRef} returned for revision`
				: "Booking returned for revision";
		case "upload_payment_proof":
			return invoiceNumber
				? `Payment proof uploaded for Invoice #${invoiceNumber}`
				: "Payment proof uploaded";
		case "payment.verified":
			return invoiceNumber
				? `Payment verified for Invoice #${invoiceNumber}`
				: "Payment verified";
		case "payment.rejected":
			return invoiceNumber
				? `Payment rejected for Invoice #${invoiceNumber}`
				: "Payment rejected";
		case "document_uploaded":
			if (metadata.documentType === "sample_result") {
				return sampleId
					? `Results uploaded for Sample ${sampleId}`
					: "Results uploaded";
			}
			return "Document uploaded";
		case "analysis_result_deleted":
			return bookingRef
				? `Analysis result deleted for Booking #${bookingRef}`
				: "Analysis result deleted";
		case "modification_approved":
			return bookingRef
				? `Service modification approved for Booking #${bookingRef}`
				: "Service modification approved";
		case "modification_rejected":
			return bookingRef
				? `Service modification rejected for Booking #${bookingRef}`
				: "Service modification rejected";
		case "VERIFY_SIGNATURE":
			return bookingRef
				? `Service form signature verified for Booking #${bookingRef}`
				: "Service form signature verified";
		default: {
			const humanized = humanizeAction(action);
			const context = [entity, entityId].filter(Boolean).join(" ");
			return context ? `${humanized} · ${context}` : humanized;
		}
	}
}

function humanizeAction(action: string): string {
	const spaced = action.replace(/[._]/g, " ");
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
