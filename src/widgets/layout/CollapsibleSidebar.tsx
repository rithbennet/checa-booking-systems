"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
	BarChart3,
	Calendar,
	ClipboardList,
	DollarSign,
	FileText,
	FlaskConical,
	HelpCircle,
	LayoutDashboard,
	Loader2,
	LogOut,
	RefreshCw,
	Settings,
	User,
	Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useUserProfile } from "@/entities/user";
import { SignOutModal } from "@/features/authentication/ui/SignOutModal";
import { FeedbackButton } from "@/features/help";
import { NotificationNavBadge } from "@/features/notifications";
import { cn } from "@/shared/lib/utils";
import type { CurrentUser } from "@/shared/server/current-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/shared/ui/shadcn/sidebar";

interface NavItem {
	icon: LucideIcon;
	label: string;
	href: string;
	badge?: number;
}

export default function CollapsibleSidebar({
	session,
}: {
	session: CurrentUser | null;
}) {
	const pathname = usePathname();
	const queryClient = useQueryClient();
	const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const { toggleSidebar } = useSidebar();

	// Get user profile to access profileImageUrl
	const { data: profile } = useUserProfile();

	const role = session?.role;
	const isAdmin = role === "lab_administrator";

	const isActive = (href: string) => pathname?.startsWith(href);

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await queryClient.invalidateQueries();
			toast.success("Refreshed", {
				description: "All data has been refreshed",
			});
		} catch {
			toast.error("Refresh failed", {
				description: "Please try again",
			});
		} finally {
			setIsRefreshing(false);
		}
	};

	// Admin menu items (Administrator-only per PRD)
	const adminNavItems: NavItem[] = [
		{ icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
		{ icon: Users, label: "Users", href: "/admin/users" },
		{ icon: FlaskConical, label: "Services", href: "/admin/services" },
		{ icon: Calendar, label: "Bookings", href: "/admin/bookings" },
		{ icon: ClipboardList, label: "Operations", href: "/admin/operations" },
		{
			icon: DollarSign,
			label: "Financial Management",
			href: "/admin/finance",
		},
		{ icon: BarChart3, label: "System Activity", href: "/admin/analytics" },
	];

	// Customer menu items (Global navigation per PRD)
	const customerNavItems: NavItem[] = [
		{ icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
		{ icon: FlaskConical, label: "Browse Services", href: "/services" },
		{ icon: Calendar, label: "My Bookings", href: "/bookings" },
		{ icon: DollarSign, label: "Financials", href: "/financials" },
		{ icon: FileText, label: "Results", href: "/results" },
	];

	const navItems = isAdmin ? adminNavItems : customerNavItems;

	// Bottom items - Settings is admin-only per PRD
	const bottomItems: NavItem[] = [
		...(isAdmin
			? [{ icon: Settings, label: "Settings", href: "/admin/settings" }]
			: []),
		{
			icon: HelpCircle,
			label: "Help",
			href: isAdmin ? "/admin/help" : "/help",
		},
		{
			icon: User,
			label: "Profile",
			href: isAdmin ? "/admin/profile" : "/profile",
		},
	];

	const notificationsHref = isAdmin ? "/admin/notifications" : "/notifications";
	const isNotificationsActive = isActive(notificationsHref);

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<div className="flex items-center gap-2 py-1.5">
					<button
						className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
						onClick={toggleSidebar}
						type="button"
					>
						<div
							className={cn(
								"flex h-8 w-8 items-center justify-center rounded-lg",
								isAdmin ? "bg-red-600" : "bg-blue-600",
							)}
						>
							<FlaskConical className="h-4 w-4 text-white" />
						</div>
					</button>
					<div className="flex min-w-0 flex-1 items-center gap-2 group-data-[collapsible=icon]:hidden">
						<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
							<p className="truncate font-bold text-gray-900 text-sm leading-tight">
								{isAdmin ? "Admin Portal" : "ChECA Lab"}
							</p>
							<p className="truncate text-gray-600 text-xs leading-tight">
								{isAdmin ? "Management" : "Service Portal"}
							</p>
						</div>
					</div>
				</div>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Navigation</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => {
								const Icon = item.icon;
								const active = isActive(item.href);
								return (
									<SidebarMenuItem key={item.label}>
										<SidebarMenuButton
											asChild
											isActive={active}
											tooltip={item.label}
										>
											<Link href={item.href}>
												<Icon />
												<span>{item.label}</span>
												{item.badge && (
													<span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 font-semibold text-white text-xs">
														{item.badge}
													</span>
												)}
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				{/* Feedback/Bug Report Button */}
				<SidebarMenuItem>
					<FeedbackButton session={session} />
				</SidebarMenuItem>
				<SidebarMenu>
					{/* Refresh button - only for non-admin users */}
					{!isAdmin && (
						<SidebarMenuItem>
							<SidebarMenuButton
								disabled={isRefreshing}
								onClick={handleRefresh}
								tooltip={isRefreshing ? "Refreshing..." : "Refresh all data"}
							>
								{isRefreshing ? (
									<Loader2 className="animate-spin" />
								) : (
									<RefreshCw />
								)}
								<span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					)}
					{bottomItems.map((item) => {
						const Icon = item.icon;
						const active = isActive(item.href);
						return (
							<SidebarMenuItem key={item.label}>
								<SidebarMenuButton
									asChild
									isActive={active}
									tooltip={item.label}
								>
									<Link href={item.href}>
										<Icon />
										<span>{item.label}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						);
					})}
					{/* Notifications with unread badge */}
					<NotificationNavBadge
						href={notificationsHref}
						isActive={isNotificationsActive}
					/>

					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={() => setIsSignOutModalOpen(true)}
							tooltip="Sign Out"
						>
							<LogOut />
							<span>Sign Out</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>

				{session && (
					<div className="border-t px-2 py-2">
						<div className="flex items-center gap-2 rounded-md px-2 py-1.5">
							<div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
								{profile?.profileImageUrl ? (
									<Image
										alt={session.name ?? session.email ?? "User"}
										className="h-full w-full object-cover"
										height={32}
										src={profile.profileImageUrl}
										width={32}
									/>
								) : (
									<User className="h-4 w-4 text-gray-700" />
								)}
							</div>
							<div className="flex min-w-0 flex-1 flex-col">
								<p className="truncate font-medium text-gray-900 text-sm">
									{session.name ?? session.email}
								</p>
								<p className="truncate text-gray-600 text-xs">
									{session.role
										?.replace(/_/g, " ")
										.replace(/\b\w/g, (c: string) => c.toUpperCase())}
								</p>
							</div>
						</div>
					</div>
				)}
			</SidebarFooter>

			{/* Sign Out Modal */}
			<SignOutModal
				onOpenChange={setIsSignOutModalOpen}
				open={isSignOutModalOpen}
			/>
		</Sidebar>
	);
}
