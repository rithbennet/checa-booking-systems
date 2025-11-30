/**
 * Notifications List Component
 * Full page list of all notifications with filtering
 */

"use client";

import { format, formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, Filter } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
    useMarkAllNotificationsRead,
    useMarkNotificationRead,
    useNotifications,
} from "@/entities/notification/api";
import type {
    NotificationType,
    NotificationVM,
} from "@/entities/notification/model/types";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/shadcn/button";
import { Card, CardContent } from "@/shared/ui/shadcn/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/shadcn/select";

type FilterOption = "all" | "unread" | NotificationType;

/**
 * Get notification category for grouping
 */
function getNotificationCategory(type: NotificationType): string {
    if (type.startsWith("booking")) return "Bookings";
    if (type.includes("payment") || type.includes("invoice")) return "Finance";
    if (type.includes("sample") || type.includes("results"))
        return "Samples & Results";
    if (type.includes("form")) return "Forms";
    return "General";
}

/**
 * Get notification icon color based on type
 */
function getNotificationColor(type: NotificationType): string {
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
 * Get the link for a notification
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

export function NotificationsList() {
    const [filter, setFilter] = useState<FilterOption>("all");
    const { data, isLoading } = useNotifications();
    const markRead = useMarkNotificationRead();
    const markAllRead = useMarkAllNotificationsRead();

    const notifications = data?.items ?? [];
    const unreadCount = data?.unreadCount ?? 0;

    // Filter notifications
    const filteredNotifications = notifications.filter((n) => {
        if (filter === "all") return true;
        if (filter === "unread") return !n.isRead;
        return n.type === filter;
    });

    // Group notifications by date
    const groupedNotifications = filteredNotifications.reduce(
        (groups, notification) => {
            const date = format(new Date(notification.createdAt), "yyyy-MM-dd");
            const label = format(new Date(notification.createdAt), "MMMM d, yyyy");
            if (!groups[date]) {
                groups[date] = { label, items: [] };
            }
            groups[date].items.push(notification);
            return groups;
        },
        {} as Record<string, { label: string; items: NotificationVM[] }>,
    );

    const handleMarkRead = (id: string) => {
        markRead.mutate(id);
    };

    const handleMarkAllRead = () => {
        markAllRead.mutate();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-bold text-2xl text-gray-900">Notifications</h1>
                    <p className="text-gray-500 text-sm">
                        {unreadCount > 0
                            ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                            : "You're all caught up!"}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select
                        onValueChange={(value) => setFilter(value as FilterOption)}
                        value={filter}
                    >
                        <SelectTrigger className="w-[180px]">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Filter by..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All notifications</SelectItem>
                            <SelectItem value="unread">Unread only</SelectItem>
                        </SelectContent>
                    </Select>
                    {unreadCount > 0 && (
                        <Button
                            disabled={markAllRead.isPending}
                            onClick={handleMarkAllRead}
                            variant="outline"
                        >
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Mark all as read
                        </Button>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            {filteredNotifications.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Bell className="mb-3 h-12 w-12 text-gray-300" />
                        <p className="font-medium text-gray-700">No notifications</p>
                        <p className="text-gray-500 text-sm">
                            {filter === "unread"
                                ? "You've read all your notifications"
                                : "You don't have any notifications yet"}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedNotifications).map(([date, group]) => (
                        <div key={date}>
                            <h3 className="mb-3 font-medium text-gray-500 text-sm">
                                {group.label}
                            </h3>
                            <Card>
                                <CardContent className="divide-y p-0">
                                    {group.items.map((notification) => {
                                        const link = getNotificationLink(notification);
                                        const colorClass = getNotificationColor(notification.type);

                                        const content = (
                                            <button
                                                className={cn(
                                                    "flex w-full gap-4 p-4 text-left transition-colors",
                                                    notification.isRead ? "bg-white" : "bg-blue-50/50",
                                                    link && "cursor-pointer hover:bg-gray-50",
                                                )}
                                                onClick={() => {
                                                    if (!notification.isRead) {
                                                        handleMarkRead(notification.id);
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
                                                        <div className="flex items-center gap-2">
                                                            <span className="shrink-0 text-gray-400 text-xs">
                                                                {formatDistanceToNow(
                                                                    new Date(notification.createdAt),
                                                                    { addSuffix: true },
                                                                )}
                                                            </span>
                                                            {!notification.isRead && (
                                                                <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="mt-1 text-gray-500 text-sm">
                                                        {notification.message}
                                                    </p>
                                                    <span className="mt-2 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 text-xs">
                                                        {getNotificationCategory(notification.type)}
                                                    </span>
                                                </div>
                                            </button>
                                        );

                                        if (link) {
                                            return (
                                                <Link href={link} key={notification.id}>
                                                    {content}
                                                </Link>
                                            );
                                        }

                                        return <div key={notification.id}>{content}</div>;
                                    })}
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default NotificationsList;
