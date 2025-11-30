"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useNotifications } from "@/entities/notification";
import { SidebarMenuButton, SidebarMenuItem } from "@/shared/ui/shadcn/sidebar";

interface NotificationNavBadgeProps {
    isActive: boolean;
}

export function NotificationNavBadge({ isActive }: NotificationNavBadgeProps) {
    const { data } = useNotifications();
    const unreadCount = data?.unreadCount ?? 0;

    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive} tooltip="Notifications">
                <Link href="/notifications">
                    <Bell />
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 font-semibold text-white text-xs">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}
