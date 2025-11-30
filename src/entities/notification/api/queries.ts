import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NotificationsResponse } from "../model/types";
import { notificationKeys } from "./query-keys";

/**
 * Hook to get user notifications
 */
export function useNotifications() {
	return useQuery<NotificationsResponse>({
		queryKey: notificationKeys.list(),
		queryFn: async () => {
			const res = await fetch("/api/user/notifications");
			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.error || "Failed to fetch notifications");
			}
			return res.json();
		},
		staleTime: 60 * 1000, // 1 minute
	});
}

/**
 * Hook to mark a notification as read
 */
export function useMarkNotificationRead() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (notificationId: string) => {
			const res = await fetch(
				`/api/user/notifications/${notificationId}/read`,
				{
					method: "POST",
				},
			);
			if (!res.ok) throw new Error("Failed to mark notification as read");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: notificationKeys.all });
		},
	});
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllNotificationsRead() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const res = await fetch("/api/user/notifications/read-all", {
				method: "POST",
			});
			if (!res.ok) throw new Error("Failed to mark all notifications as read");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: notificationKeys.all });
		},
	});
}
