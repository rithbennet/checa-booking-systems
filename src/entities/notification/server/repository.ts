/**
 * Notification Repository
 * Data access layer for notification operations
 */

import { db } from "@/shared/server/db";
import type { NotificationsResponse, NotificationVM } from "../model/types";

/**
 * Get user notifications
 */
export async function getUserNotifications(
	userId: string,
): Promise<NotificationsResponse> {
	const notifications = await db.notification.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
		take: 50, // Limit to last 50 notifications
	});

	const unreadCount = notifications.filter((n) => n.readAt === null).length;

	const items: NotificationVM[] = notifications.map((n) => ({
		id: n.id,
		type: n.type as NotificationVM["type"],
		title: n.title,
		message: n.message,
		relatedEntityType: n.relatedEntityType,
		relatedEntityId: n.relatedEntityId,
		isRead: n.readAt !== null,
		createdAt: n.createdAt.toISOString(),
	}));

	return { items, unreadCount };
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
	notificationId: string,
	userId: string,
): Promise<boolean> {
	const notification = await db.notification.findFirst({
		where: { id: notificationId, userId },
	});

	if (!notification) return false;

	await db.notification.update({
		where: { id: notificationId },
		data: { readAt: new Date() },
	});

	return true;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
	userId: string,
): Promise<number> {
	const result = await db.notification.updateMany({
		where: { userId, readAt: null },
		data: { readAt: new Date() },
	});

	return result.count;
}
