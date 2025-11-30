"use client";

import {
	AlertCircle,
	Bell,
	BellOff,
	CheckCheck,
	FileText,
	Loader2,
	Receipt,
	TestTube,
} from "lucide-react";
import Link from "next/link";
import type { NotificationType, NotificationVM } from "@/entities/notification";
import {
	useMarkAllNotificationsRead,
	useMarkNotificationRead,
	useNotifications,
} from "@/entities/notification";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";

function formatTimeAgo(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffMins < 1) return "Just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return date.toLocaleDateString();
}

function getNotificationIcon(type: NotificationType) {
	switch (type) {
		case "booking_submitted":
		case "booking_pending_verification":
		case "booking_approved":
		case "booking_rejected":
			return <FileText className="size-5" />;
		case "invoice_uploaded":
		case "payment_reminder":
		case "payment_verified":
			return <Receipt className="size-5" />;
		case "results_available":
		case "sample_return_requested":
		case "sample_returned":
			return <TestTube className="size-5" />;
		default:
			return <Bell className="size-5" />;
	}
}

function getNotificationLink(notification: NotificationVM): string | null {
	if (!notification.relatedEntityType || !notification.relatedEntityId) {
		return null;
	}

	switch (notification.relatedEntityType) {
		case "booking":
			return `/bookings/${notification.relatedEntityId}`;
		case "invoice":
			return "/financials";
		case "sample":
			return "/results";
		default:
			return null;
	}
}

function NotificationItem({
	notification,
	onMarkRead,
}: {
	notification: NotificationVM;
	onMarkRead: (id: string) => void;
}) {
	const link = getNotificationLink(notification);

	const content = (
		<button
			className={`flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors ${
				notification.isRead ? "bg-white" : "border-blue-200 bg-blue-50/50"
			} ${link ? "cursor-pointer hover:bg-slate-50" : ""}`}
			onClick={() => {
				if (!notification.isRead) {
					onMarkRead(notification.id);
				}
			}}
			type="button"
		>
			<div
				className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
					notification.isRead
						? "bg-slate-100 text-slate-500"
						: "bg-blue-100 text-blue-600"
				}`}
			>
				{getNotificationIcon(notification.type)}
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex items-start justify-between gap-2">
					<p
						className={`font-medium text-sm ${
							notification.isRead ? "text-slate-700" : "text-slate-900"
						}`}
					>
						{notification.title}
					</p>
					<span className="shrink-0 text-slate-500 text-xs">
						{formatTimeAgo(notification.createdAt)}
					</span>
				</div>
				<p className="mt-1 text-slate-600 text-sm">{notification.message}</p>
				{!notification.isRead && (
					<div className="mt-2">
						<span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-700 text-xs">
							New
						</span>
					</div>
				)}
			</div>
		</button>
	);

	if (link) {
		return <Link href={link}>{content}</Link>;
	}

	return content;
}

export default function NotificationsPage() {
	const { data, isLoading, error } = useNotifications();
	const { mutate: markRead } = useMarkNotificationRead();
	const { mutate: markAllRead, isPending: isMarkingAllRead } =
		useMarkAllNotificationsRead();

	if (isLoading) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="flex min-h-[400px] flex-col items-center justify-center gap-2 text-muted-foreground">
				<AlertCircle className="size-8" />
				<p>Failed to load notifications. Please try again.</p>
			</div>
		);
	}

	const { items, unreadCount } = data;

	return (
		<div className="space-y-6 p-6">
			{/* Page Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-slate-900">Notifications</h1>
					<p className="text-muted-foreground text-sm">
						{unreadCount > 0
							? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
							: "You're all caught up!"}
					</p>
				</div>
				{unreadCount > 0 && (
					<Button
						disabled={isMarkingAllRead}
						onClick={() => markAllRead()}
						size="sm"
						variant="outline"
					>
						<CheckCheck className="mr-2 size-4" />
						Mark all as read
					</Button>
				)}
			</div>

			{/* Notifications List */}
			{items.length === 0 ? (
				<Card>
					<CardHeader className="text-center">
						<div className="mx-auto flex size-16 items-center justify-center rounded-full bg-slate-100">
							<BellOff className="size-8 text-slate-400" />
						</div>
						<CardTitle className="mt-4">No notifications</CardTitle>
						<CardDescription>
							You don't have any notifications yet. We'll notify you when
							something important happens.
						</CardDescription>
					</CardHeader>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Recent Activity</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{items.map((notification) => (
							<NotificationItem
								key={notification.id}
								notification={notification}
								onMarkRead={markRead}
							/>
						))}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
