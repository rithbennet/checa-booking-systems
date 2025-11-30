/**
 * NotificationBell Component
 * Displays a notification bell icon with unread count badge and dropdown
 */

"use client";

import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
	useMarkAllNotificationsRead,
	useMarkNotificationRead,
	useNotifications,
} from "@/entities/notification/api";
import type { NotificationVM } from "@/entities/notification/model/types";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shared/ui/shadcn/popover";
import { Separator } from "@/shared/ui/shadcn/separator";

/**
 * Get notification icon color based on type
 */
function getNotificationColor(type: NotificationVM["type"]): string {
	switch (type) {
		case "booking_approved":
		case "payment_verified":
		case "results_available":
		case "process_complete":
			return "bg-green-100 text-green-600";
		case "booking_rejected":
			return "bg-red-100 text-red-600";
		case "booking_submitted":
		case "booking_pending_verification":
			return "bg-blue-100 text-blue-600";
		case "service_modification_requested":
		case "payment_reminder":
			return "bg-amber-100 text-amber-600";
		case "invoice_uploaded":
		case "service_form_ready":
		case "forms_signed_uploaded":
			return "bg-purple-100 text-purple-600";
		case "sample_return_requested":
		case "sample_returned":
			return "bg-cyan-100 text-cyan-600";
		default:
			return "bg-gray-100 text-gray-600";
	}
}

/**
 * Get the link for a notification based on its type and related entity
 */
function getNotificationLink(notification: NotificationVM): string | null {
	if (!notification.relatedEntityId) return null;

	switch (notification.relatedEntityType) {
		case "booking":
			return `/bookings/${notification.relatedEntityId}`;
		case "user":
			return "/profile";
		case "sample":
			return "/samples";
		case "invoice":
		case "payment":
			return "/financials";
		default:
			return null;
	}
}

interface NotificationItemProps {
	notification: NotificationVM;
	onMarkRead: (id: string) => void;
	onClose: () => void;
}

function NotificationItem({
	notification,
	onMarkRead,
	onClose,
}: NotificationItemProps) {
	const link = getNotificationLink(notification);
	const colorClass = getNotificationColor(notification.type);

	const content = (
		<button
			className={cn(
				"flex w-full gap-3 rounded-lg p-3 text-left transition-colors",
				notification.isRead ? "bg-white" : "bg-blue-50",
				link && "cursor-pointer hover:bg-gray-50",
			)}
			onClick={() => {
				if (!notification.isRead) {
					onMarkRead(notification.id);
				}
			}}
			type="button"
		>
			<div
				className={cn(
					"flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
					colorClass,
				)}
			>
				<Bell className="h-4 w-4" />
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex items-start justify-between gap-2">
					<p
						className={cn(
							"text-sm",
							notification.isRead
								? "font-normal text-gray-700"
								: "font-medium text-gray-900",
						)}
					>
						{notification.title}
					</p>
					{!notification.isRead && (
						<span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
					)}
				</div>
				<p className="mt-0.5 line-clamp-2 text-gray-500 text-xs">
					{notification.message}
				</p>
				<p className="mt-1 text-gray-400 text-xs">
					{formatDistanceToNow(new Date(notification.createdAt), {
						addSuffix: true,
					})}
				</p>
			</div>
			{link && <ExternalLink className="h-4 w-4 shrink-0 text-gray-400" />}
		</button>
	);

	if (link) {
		return (
			<Link href={link} onClick={onClose}>
				{content}
			</Link>
		);
	}

	return content;
}

export function NotificationBell() {
	const [isOpen, setIsOpen] = useState(false);
	const { data, isLoading } = useNotifications();
	const markRead = useMarkNotificationRead();
	const markAllRead = useMarkAllNotificationsRead();

	const notifications = data?.items ?? [];
	const unreadCount = data?.unreadCount ?? 0;

	const handleMarkRead = (id: string) => {
		markRead.mutate(id);
	};

	const handleMarkAllRead = () => {
		markAllRead.mutate();
	};

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger asChild>
				<Button
					aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
					className="relative"
					size="icon"
					variant="ghost"
				>
					<Bell className="h-5 w-5" />
					{unreadCount > 0 && (
						<span className="-top-1 -right-1 absolute flex h-5 w-5 items-center justify-center rounded-full bg-red-500 font-bold text-white text-xs">
							{unreadCount > 9 ? "9+" : unreadCount}
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-[380px] p-0" sideOffset={8}>
				{/* Header */}
				<div className="flex items-center justify-between border-b px-4 py-3">
					<div>
						<h3 className="font-semibold text-gray-900">Notifications</h3>
						{unreadCount > 0 && (
							<p className="text-gray-500 text-xs">
								{unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
							</p>
						)}
					</div>
					{unreadCount > 0 && (
						<Button
							className="text-blue-600 hover:text-blue-700"
							disabled={markAllRead.isPending}
							onClick={handleMarkAllRead}
							size="sm"
							variant="ghost"
						>
							<CheckCheck className="mr-1 h-4 w-4" />
							Mark all read
						</Button>
					)}
				</div>

				{/* Notification List */}
				<div className="max-h-[400px] overflow-y-auto">
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
						</div>
					) : notifications.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-gray-500">
							<Bell className="mb-2 h-10 w-10 text-gray-300" />
							<p className="text-sm">No notifications yet</p>
						</div>
					) : (
						<div className="divide-y">
							{notifications.slice(0, 10).map((notification) => (
								<NotificationItem
									key={notification.id}
									notification={notification}
									onClose={() => setIsOpen(false)}
									onMarkRead={handleMarkRead}
								/>
							))}
						</div>
					)}
				</div>

				{/* Footer */}
				{notifications.length > 0 && (
					<>
						<Separator />
						<div className="p-2">
							<Button
								asChild
								className="w-full justify-center text-blue-600 hover:text-blue-700"
								onClick={() => setIsOpen(false)}
								variant="ghost"
							>
								<Link href="/notifications">View all notifications</Link>
							</Button>
						</div>
					</>
				)}
			</PopoverContent>
		</Popover>
	);
}

export default NotificationBell;
