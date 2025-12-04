/**
 * Modification Notifications
 * Handles notifications for booking modification requests
 */

import { db } from "@/shared/server/db";
import type { notification_type_enum } from "../../../../generated/prisma";

/**
 * Get all admin user IDs for notification
 */
async function getAdminUserIds(): Promise<string[]> {
	const admins = await db.user.findMany({
		where: { userType: "lab_administrator", status: "active" },
		select: { id: true },
	});
	return admins.map((a) => a.id);
}

/**
 * Enqueue an in-app notification
 */
async function enqueueInApp(params: {
	userId: string;
	type: notification_type_enum;
	relatedEntityType: string;
	relatedEntityId: string;
	title: string;
	message: string;
}) {
	return db.notification.create({
		data: {
			userId: params.userId,
			type: params.type,
			relatedEntityType: params.relatedEntityType,
			relatedEntityId: params.relatedEntityId,
			title: params.title,
			message: params.message,
			emailSent: false,
		},
	});
}

/**
 * Notify user when admin proposes a modification to their booking
 * Called after admin creates a modification request
 */
export async function notifyUserModificationRequested(params: {
	userId: string;
	bookingId: string;
	bookingReference: string;
	serviceName: string;
	originalQuantity: number;
	newQuantity: number;
	reason: string;
}) {
	const quantityChange =
		params.newQuantity > params.originalQuantity
			? `increased from ${params.originalQuantity} to ${params.newQuantity}`
			: `decreased from ${params.originalQuantity} to ${params.newQuantity}`;

	await enqueueInApp({
		userId: params.userId,
		type: "service_modification_requested",
		relatedEntityType: "booking",
		relatedEntityId: params.bookingId,
		title: "Modification Request",
		message: `The lab has requested to modify "${params.serviceName}" - quantity ${quantityChange}. Please review and respond.`,
	});

	// Future: add email notification here
}

/**
 * Notify admins when user approves a modification
 */
export async function notifyAdminModificationApproved(params: {
	bookingId: string;
	bookingReference: string;
	serviceName: string;
	customerName: string;
	originalQuantity: number;
	newQuantity: number;
}) {
	const adminIds = await getAdminUserIds();

	for (const adminId of adminIds) {
		await enqueueInApp({
			userId: adminId,
			type: "service_modification_requested",
			relatedEntityType: "booking",
			relatedEntityId: params.bookingId,
			title: "Modification Approved",
			message: `${params.customerName} approved the modification for "${params.serviceName}" (${params.bookingReference}). Quantity changed to ${params.newQuantity}.`,
		});
	}
}

/**
 * Notify admins when user rejects a modification
 */
export async function notifyAdminModificationRejected(params: {
	bookingId: string;
	bookingReference: string;
	serviceName: string;
	customerName: string;
}) {
	const adminIds = await getAdminUserIds();

	for (const adminId of adminIds) {
		await enqueueInApp({
			userId: adminId,
			type: "service_modification_requested",
			relatedEntityType: "booking",
			relatedEntityId: params.bookingId,
			title: "Modification Rejected",
			message: `${params.customerName} rejected the modification for "${params.serviceName}" (${params.bookingReference}). Booking remains unchanged.`,
		});
	}
}

/**
 * Notify admins when user creates a modification request
 * Called after user creates a modification request for their booking
 */
export async function notifyAdminUserModificationRequested(params: {
	bookingId: string;
	bookingReference: string;
	serviceName: string;
	customerName: string;
	originalQuantity: number;
	newQuantity: number;
	reason: string;
}) {
	const adminIds = await getAdminUserIds();

	const quantityChange =
		params.newQuantity > params.originalQuantity
			? `increase from ${params.originalQuantity} to ${params.newQuantity}`
			: `decrease from ${params.originalQuantity} to ${params.newQuantity}`;

	for (const adminId of adminIds) {
		await enqueueInApp({
			userId: adminId,
			type: "service_modification_requested",
			relatedEntityType: "booking",
			relatedEntityId: params.bookingId,
			title: "User Modification Request",
			message: `${params.customerName} requested a modification for "${params.serviceName}" (${params.bookingReference}) - ${quantityChange}. Reason: ${params.reason.substring(0, 100)}${params.reason.length > 100 ? "..." : ""}`,
		});
	}
}
