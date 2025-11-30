/**
 * UserWorkspaceCard Component
 *
 * Displays workspace booking details for the user.
 */

"use client";

import { Calendar, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { UserWorkspaceBookingVM } from "@/entities/booking/model/user-detail-types";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/shadcn/badge";
import { formatCurrency, formatDate, getDurationDays } from "../lib/helpers";

interface UserWorkspaceCardProps {
	workspace: UserWorkspaceBookingVM;
}

export function UserWorkspaceCard({ workspace }: UserWorkspaceCardProps) {
	const [isOpen, setIsOpen] = useState(true);

	const durationDays = getDurationDays(workspace.startDate, workspace.endDate);

	// Calculate total add-ons
	const addOnsTotal = workspace.serviceAddOns.reduce(
		(sum, addon) => sum + Number.parseFloat(addon.amount),
		0,
	);

	return (
		<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
			{/* Header */}
			<button
				className="flex w-full cursor-pointer items-center justify-between border-amber-500 border-l-4 p-5 transition-colors hover:bg-slate-50"
				onClick={() => setIsOpen(!isOpen)}
				type="button"
			>
				<div className="flex items-center gap-4">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
						<Calendar className="h-5 w-5" />
					</div>
					<div className="text-left">
						<h3 className="font-bold text-slate-900">Workspace Rental</h3>
						<p className="text-slate-500 text-xs">
							{formatDate(workspace.startDate)} -{" "}
							{formatDate(workspace.endDate)}
							{" • "}
							{durationDays} {durationDays === 1 ? "day" : "days"}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-4">
					<Badge
						className="border-amber-200 bg-amber-100 text-amber-700"
						variant="outline"
					>
						Workspace
					</Badge>
					<ChevronDown
						className={cn(
							"h-5 w-5 text-slate-400 transition-transform duration-200",
							isOpen && "rotate-180",
						)}
					/>
				</div>
			</button>

			{/* Content */}
			{isOpen && (
				<div className="border-slate-100 border-t bg-slate-50/50">
					{/* Details Grid */}
					<div className="grid gap-4 border-slate-200/60 border-b bg-white p-4 md:grid-cols-2">
						{workspace.preferredTimeSlot && (
							<div>
								<p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">
									Preferred Time Slot
								</p>
								<p className="text-slate-900">{workspace.preferredTimeSlot}</p>
							</div>
						)}
						{workspace.purpose && (
							<div>
								<p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">
									Purpose
								</p>
								<p className="text-slate-900">{workspace.purpose}</p>
							</div>
						)}
						{workspace.notes && (
							<div className="md:col-span-2">
								<p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">
									Notes
								</p>
								<p className="text-slate-700 text-sm">{workspace.notes}</p>
							</div>
						)}
					</div>

					{/* Equipment Usage */}
					{workspace.equipmentUsages.length > 0 && (
						<div className="border-slate-200/60 border-b bg-white p-4">
							<p className="mb-2 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
								Equipment
							</p>
							<div className="flex flex-wrap gap-2">
								{workspace.equipmentUsages.map((eu) => (
									<Badge
										className="border-slate-200 bg-slate-100 text-slate-700"
										key={eu.equipment.id}
										variant="outline"
									>
										{eu.equipment.name}
									</Badge>
								))}
							</div>
						</div>
					)}

					{/* Add-ons */}
					{workspace.serviceAddOns.length > 0 && (
						<div className="bg-white p-4">
							<p className="mb-2 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
								Add-ons
							</p>
							<div className="space-y-2">
								{workspace.serviceAddOns.map((addon) => (
									<div
										className="flex items-center justify-between"
										key={addon.id}
									>
										<span className="text-slate-700 text-sm">{addon.name}</span>
										<span className="font-medium text-slate-900 text-sm">
											{formatCurrency(addon.amount)}
										</span>
									</div>
								))}
								{addOnsTotal > 0 && (
									<div className="flex items-center justify-between border-slate-200 border-t pt-2">
										<span className="font-medium text-slate-700 text-sm">
											Add-ons Total
										</span>
										<span className="font-bold text-slate-900">
											{formatCurrency(addOnsTotal)}
										</span>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
