/**
 * BookingHeader Component
 *
 * Displays customer information, organization badge, and global actions
 * for the booking command center.
 */

"use client";

import {
	ChevronDown,
	Copy,
	Mail,
	Phone,
	Printer,
	Settings,
	User,
} from "lucide-react";
import { useState } from "react";
import type { BookingCommandCenterVM } from "@/entities/booking/model/command-center-types";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/ui/shadcn/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";

interface BookingHeaderProps {
	booking: BookingCommandCenterVM;
}

export function BookingHeader({ booking }: BookingHeaderProps) {
	const [emailCopied, setEmailCopied] = useState(false);

	const fullName = `${booking.user.firstName} ${booking.user.lastName}`;
	const initials =
		`${booking.user.firstName.charAt(0)}${booking.user.lastName.charAt(0)}`.toUpperCase();

	const copyEmail = async () => {
		await navigator.clipboard.writeText(booking.user.email);
		setEmailCopied(true);
		setTimeout(() => setEmailCopied(false), 2000);
	};

	return (
		<div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
			<div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
				{/* Customer Context */}
				<div className="flex items-start gap-4">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 font-bold text-lg text-white">
						{initials}
					</div>
					<div>
						<div className="mb-1 flex items-center gap-2">
							<h1 className="font-bold text-slate-900 text-xl">
								{booking.organizationName ?? fullName}
							</h1>
							<Badge
								className={
									booking.isExternal
										? "border-blue-200 bg-blue-50 text-blue-700"
										: "border-green-200 bg-green-50 text-green-700"
								}
								variant="outline"
							>
								{booking.isExternal ? "External" : "Internal"}
							</Badge>
						</div>
						<div className="flex flex-wrap gap-4 text-slate-500 text-xs">
							<span className="flex items-center gap-1">
								<User className="h-3 w-3" />
								{fullName}
							</span>
							<button
								className="group flex cursor-pointer items-center gap-1 transition-colors hover:text-blue-600"
								onClick={copyEmail}
								type="button"
							>
								<Mail className="h-3 w-3" />
								{booking.user.email}
								<Copy
									className={`ml-1 h-3 w-3 transition-opacity ${emailCopied ? "text-green-600 opacity-100" : "opacity-0 group-hover:opacity-100"}`}
								/>
							</button>
							{booking.user.phone && (
								<span className="flex items-center gap-1">
									<Phone className="h-3 w-3" />
									{booking.user.phone}
								</span>
							)}
						</div>
					</div>
				</div>

				{/* Global Actions */}
				<div className="flex gap-2">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 text-sm shadow-sm hover:bg-slate-50"
									disabled
									variant="outline"
								>
									<Printer className="mr-2 h-4 w-4" />
									Manifest
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Print manifest - Coming soon</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 text-sm shadow-sm hover:bg-slate-50"
								variant="outline"
							>
								<Settings className="mr-2 h-4 w-4" />
								Manage
								<ChevronDown className="ml-2 h-3 w-3" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<DropdownMenuItem
											className="text-slate-400 text-xs"
											disabled
										>
											Hold Booking
										</DropdownMenuItem>
									</TooltipTrigger>
									<TooltipContent side="left">
										<p>Hold booking - Coming soon</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<DropdownMenuItem className="text-red-300 text-xs" disabled>
											Cancel Booking
										</DropdownMenuItem>
									</TooltipTrigger>
									<TooltipContent side="left">
										<p>Cancel booking - Coming soon</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</div>
	);
}
