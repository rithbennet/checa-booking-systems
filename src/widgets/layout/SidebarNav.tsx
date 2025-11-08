"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Session = {
	user: {
		role?: string | null;
	};
};

export default function SidebarNav({ session }: { session: Session | null }) {
	const pathname = usePathname();
	const isAdmin = session?.user?.role === "lab_administrator";
	const isAdminRoute = pathname?.startsWith("/admin");

	if (!isAdmin || !isAdminRoute) return null;

	const navItem = (href: string, label: string) => (
		<Link
			className={`block rounded px-3 py-2 text-sm ${pathname?.startsWith(href)
				? "bg-blue-50 text-blue-700"
				: "text-gray-700 hover:bg-gray-50"
				}`}
			href={href}
		>
			{label}
		</Link>
	);

	return (
		<aside className="hidden w-64 shrink-0 border-r bg-white lg:block">
			<div className="p-4">
				<nav className="space-y-1">
					{navItem("/dashboard", "Dashboard")}
					{navItem("/admin/users", "Users")}
					{navItem("/services", "Services")}
					<details className="group">
						<summary className="flex cursor-pointer items-center justify-between rounded px-3 py-2 text-gray-700 text-sm hover:bg-gray-50">
							<span>Bookings</span>
							<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
						</summary>
						<div className="mt-1 space-y-1 pl-2">
							{navItem("/admin/bookings", "All Bookings")}
							{navItem("/admin/bookings/pending", "Pending Approvals")}
						</div>
					</details>
					{navItem("/admin/samples", "Samples")}
					<details className="group">
						<summary className="flex cursor-pointer items-center justify-between rounded px-3 py-2 text-gray-700 text-sm hover:bg-gray-50">
							<span>Finance</span>
							<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
						</summary>
						<div className="mt-1 space-y-1 pl-2">
							{navItem("/admin/invoices", "Invoices")}
							{navItem("/admin/payments", "Payments")}
						</div>
					</details>
				</nav>
			</div>
		</aside>
	);
}
