"use client";

import { Bell, FlaskConical, Menu, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { authClient } from "@/shared/server/better-auth/client";
import NavDropdown from "./NavDropdown";

type Session = {
	user: {
		name?: string | null;
		email?: string | null;
		role?: string | null;
	};
};

export default function MainNav({ session }: { session: Session | null }) {
	const pathname = usePathname();
	const [open, setOpen] = React.useState(false);
	const isLoading = false; // could be passed as prop if needed

	const role = session?.user?.role;
	const isAdmin = role === "lab_administrator";

	const isActive = (href: string) => pathname?.startsWith(href);

	/** Menu definitions */
	const adminMenu = [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Users", href: "/admin/users" },
		{ label: "Services", href: "/services" },
		{
			label: "Bookings",
			dropdown: [
				{ label: "All Bookings", href: "/admin/bookings" },
				{ label: "Pending Approvals", href: "/admin/bookings/pending" },
			],
		},
		{ label: "Samples", href: "/admin/samples" },
		{
			label: "Finance",
			dropdown: [
				{ label: "Invoices", href: "/admin/invoices" },
				{ label: "Payments", href: "/admin/payments" },
			],
		},
	];

	const customerMenu = [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Services", href: "/services" },
		{
			label: "Bookings",
			dropdown: [
				{ label: "My Bookings", href: "/bookings" },
				{ label: "New Booking", href: "/booking" },
			],
		},
		{ label: "Results", href: "/results" },
		{ label: "Payments", href: "/payments" },
	];

	const menuItems = isAdmin ? adminMenu : customerMenu;

	/** Skeleton for loading state */
	const Skeleton = () => (
		<div className="hidden animate-pulse items-center gap-3 sm:flex">
			<div className="h-5 w-5 rounded bg-gray-200" />
			<div className="h-9 w-9 rounded-full bg-gray-200" />
			<div className="h-4 w-24 rounded bg-gray-200" />
			<div className="h-4 w-12 rounded bg-gray-200" />
		</div>
	);

	/** Right side user info */
	const RightSide = () => {
		if (isLoading || !session?.user) return <Skeleton />;

		return (
			<div className="hidden items-center gap-2 sm:flex">
				<div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-700">
					<User className="h-4 w-4" />
				</div>
				<div className="leading-tight">
					<div className="max-w-40 truncate font-medium text-gray-900 text-sm">
						{session.user?.name ?? session.user?.email}
					</div>
					<div className="inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700">
						{session.user?.role
							?.replace(/_/g, " ")
							.replace(/\b\w/g, (c: string) => c.toUpperCase())}
					</div>
				</div>
				<button
					aria-label="Sign out"
					className="text-gray-700 hover:text-gray-900"
					onClick={() => authClient.signOut()}
					type="button"
				>
					⎋
				</button>
			</div>
		);
	};

	/** Render menu links (desktop) */
	const renderMenu = (items: typeof adminMenu) =>
		items.map((item) =>
			item.dropdown ? (
				<NavDropdown
					active={item.dropdown.some((d) => isActive(d.href))}
					items={item.dropdown}
					key={item.label}
					label={item.label}
				/>
			) : (
				<Link
					className={`font-medium text-sm ${
						isActive(item.href)
							? "text-blue-700"
							: "text-gray-700 hover:text-blue-700"
					}`}
					href={item.href}
					key={item.label}
				>
					{item.label}
				</Link>
			),
		);

	/** Render menu links (mobile) */
	const renderMobileMenu = (items: typeof adminMenu) =>
		items.map((item) =>
			item.dropdown ? (
				<details key={item.label}>
					<summary className="cursor-pointer text-gray-700">
						{item.label}
					</summary>
					<div className="mt-1 flex flex-col gap-2 pl-4">
						{item.dropdown.map((d) => (
							<Link
								className="text-gray-700 hover:text-blue-700"
								href={d.href}
								key={d.label}
								onClick={() => setOpen(false)}
							>
								{d.label}
							</Link>
						))}
					</div>
				</details>
			) : (
				<Link
					className="text-gray-700 hover:text-blue-700"
					href={item.href}
					key={item.label}
					onClick={() => setOpen(false)}
				>
					{item.label}
				</Link>
			),
		);

	return (
		<header className="border-b bg-white shadow-sm">
			<div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between">
					{/* Logo */}
					<div className="flex min-w-0 items-center gap-6">
						<Link className="flex min-w-0 items-center gap-3" href="/">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 sm:h-12 sm:w-12">
								<FlaskConical className="h-5 w-5 text-white sm:h-6 sm:w-6" />
							</div>
							<div className="min-w-0">
								<p className="truncate font-bold text-base text-gray-900 leading-tight sm:text-lg">
									ChECA Lab
								</p>
								<p className="truncate text-gray-600 text-xs sm:text-sm">
									Service Portal
								</p>
							</div>
						</Link>
					</div>

					{/* Desktop nav */}
					<nav className="hidden items-center gap-6 md:flex">
						{isLoading || !session?.user ? (
							<div className="flex animate-pulse items-center gap-6">
								<div className="h-4 w-20 rounded bg-gray-200" />
								<div className="h-4 w-16 rounded bg-gray-200" />
								<div className="h-4 w-24 rounded bg-gray-200" />
								<div className="h-4 w-16 rounded bg-gray-200" />
							</div>
						) : (
							renderMenu(menuItems)
						)}
					</nav>

					{/* Right side */}
					<div className="flex items-center gap-3">
						<div className="relative hidden sm:block">
							{isLoading || !session?.user ? (
								<div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
							) : (
								<>
									<Bell className="h-5 w-5 text-gray-600" />
									<span className="-top-1 -right-1 absolute h-3 w-3 rounded-full bg-red-500" />
								</>
							)}
						</div>
						<RightSide />
						{/* Hamburger */}
						<button
							aria-label="Toggle menu"
							className="md:hidden"
							onClick={() => setOpen((v) => !v)}
							type="button"
						>
							{open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
						</button>
					</div>
				</div>

				{/* Mobile menu */}
				{open && (
					<div className="mt-3 border-t pt-3 md:hidden">
						<nav className="flex flex-col gap-3">
							{isLoading || !session?.user ? (
								<div className="animate-pulse space-y-2">
									<div className="h-4 w-24 rounded bg-gray-200" />
									<div className="h-4 w-20 rounded bg-gray-200" />
									<div className="h-4 w-28 rounded bg-gray-200" />
								</div>
							) : (
								renderMobileMenu(menuItems)
							)}
							{/* Auth controls on mobile */}
							<div className="mt-2 border-t pt-2">
								{isLoading || !session?.user ? (
									<div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
								) : (
									<button
										className="text-gray-700 hover:text-gray-900"
										onClick={() => authClient.signOut()}
										type="button"
									>
										Sign out
									</button>
								)}
							</div>
						</nav>
					</div>
				)}
			</div>
		</header>
	);
}
