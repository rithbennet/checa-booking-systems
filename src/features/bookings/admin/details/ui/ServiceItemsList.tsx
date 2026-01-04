"use client";

import { ChevronDown } from "lucide-react";
import type { BookingCommandCenterVM } from "@/entities/booking/model/command-center-types";
import { Badge } from "@/shared/ui/shadcn/badge";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/shared/ui/shadcn/collapsible";
import { formatCurrency, formatDate } from "../lib/helpers";

interface ServiceItemsListProps {
	booking: BookingCommandCenterVM;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ServiceItemsList({
	booking,
	isOpen,
	onOpenChange,
}: ServiceItemsListProps) {
	const serviceCount = booking.serviceItems.length;
	const workspaceCount = booking.workspaceBookings.length;
	const totalItems = serviceCount + workspaceCount;

	return (
		<Collapsible onOpenChange={onOpenChange} open={isOpen}>
			<CollapsibleTrigger className="flex w-full items-center justify-between border-slate-100 border-b bg-slate-50/50 px-5 py-3 text-left hover:bg-slate-50">
				<div className="flex items-center gap-2">
					<span className="font-medium text-slate-700 text-xs">
						Services & Items
					</span>
					<Badge
						className="border-slate-200 bg-slate-100 text-[10px] text-slate-600"
						variant="outline"
					>
						{totalItems} {totalItems === 1 ? "item" : "items"}
					</Badge>
				</div>
				<ChevronDown
					className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
				/>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="divide-y divide-slate-100 bg-white">
					{booking.serviceItems.map((item) => (
						<div
							className="flex items-start justify-between px-5 py-3"
							key={item.id}
						>
							<div className="flex-1">
								<p className="font-medium text-slate-900 text-xs">
									{item.service.name}
								</p>
								<p className="text-[10px] text-slate-500">
									{item.quantity} {item.quantity === 1 ? "sample" : "samples"}
									{item.sampleName && ` • ${item.sampleName}`}
								</p>
							</div>
							<p className="font-bold text-slate-900 text-xs">
								{formatCurrency(item.totalPrice)}
							</p>
						</div>
					))}
					{booking.workspaceBookings.map((ws) => (
						<div
							className="flex items-start justify-between px-5 py-3"
							key={ws.id}
						>
							<div className="flex-1">
								<p className="font-medium text-slate-900 text-xs">
									Workspace Rental
								</p>
								<p className="text-[10px] text-slate-500">
									{formatDate(ws.startDate)} - {formatDate(ws.endDate)}
								</p>
							</div>
							{ws.totalPrice !== "0" && (
								<p className="font-bold text-slate-900 text-xs">
									{formatCurrency(ws.totalPrice)}
								</p>
							)}
						</div>
					))}
					{totalItems === 0 && (
						<p className="px-5 py-3 text-center text-slate-400 text-xs italic">
							No services added
						</p>
					)}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
