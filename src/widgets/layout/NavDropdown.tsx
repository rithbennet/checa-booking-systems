"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shared/ui/shadcn/popover";

type Item = { label: string; href: string };

export default function NavDropdown({
	label,
	items,
	active,
}: {
	label: string;
	items: Item[];
	active?: boolean;
}) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					className={`inline-flex items-center gap-1 font-medium text-sm transition-colors ${active ? "text-blue-700" : "text-gray-700 hover:text-blue-700"
						}`}
					type="button"
				>
					{label}
					<ChevronDown className="h-4 w-4" />
				</button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-48 p-1">
				<nav className="flex flex-col">
					{items.map((it) => (
						<Link
							className="rounded px-2 py-1.5 text-gray-700 text-sm hover:bg-gray-100 hover:text-gray-900"
							href={it.href}
							key={it.href}
						>
							{it.label}
						</Link>
					))}
				</nav>
			</PopoverContent>
		</Popover>
	);
}
