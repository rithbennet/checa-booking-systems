/**
 * WorkspaceAccordion Component
 *
 * Collapsible accordion for displaying workspace bookings with:
 * - Date range
 * - Equipment list
 * - Action toolbar (Generate Agreement, Print Door Sign, Check-in)
 */

"use client";

import {
	ArrowRight,
	Calendar,
	Check,
	ChevronDown,
	FileSignature,
	Tag,
	UserCheck,
} from "lucide-react";
import { useState } from "react";
import type { WorkspaceBookingVM } from "@/entities/booking/model/command-center-types";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";

interface WorkspaceAccordionProps {
	workspace: WorkspaceBookingVM;
}

function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDurationDays(startDate: string, endDate: string): number {
	const start = new Date(startDate);
	const end = new Date(endDate);
	const diffTime = Math.abs(end.getTime() - start.getTime());
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export function WorkspaceAccordion({ workspace }: WorkspaceAccordionProps) {
	const [isOpen, setIsOpen] = useState(true);

	const durationDays = getDurationDays(workspace.startDate, workspace.endDate);
	const durationText = durationDays === 1 ? "1 Day" : `${durationDays} Days`;

	return (
		<div
			className={cn(
				"overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
				isOpen && "accordion-open",
			)}
		>
			{/* Header */}
			<button
				className="flex w-full cursor-pointer items-center justify-between border-l-4 border-l-orange-500 p-5 transition-colors hover:bg-slate-50"
				onClick={() => setIsOpen(!isOpen)}
				type="button"
			>
				<div className="flex items-center gap-4">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
						<Calendar className="h-5 w-5" />
					</div>
					<div className="text-left">
						<h3 className="font-bold text-slate-900">Workspace Rental</h3>
						<p className="text-slate-500 text-xs">Bench • {durationText}</p>
					</div>
				</div>
				<div className="flex items-center gap-4">
					<Badge
						className="border-green-200 bg-green-100 text-green-700"
						variant="outline"
					>
						Scheduled
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
				<div className="border-slate-100 border-t bg-white">
					<div className="p-5">
						{/* Contextual Actions Toolbar */}
						<div className="mb-6 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
							<Button
								className="flex h-auto items-center rounded border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 text-xs shadow-sm transition-all hover:border-blue-500 hover:text-blue-600"
								variant="outline"
							>
								<FileSignature className="mr-2 h-3.5 w-3.5" />
								Generate Rental Agreement
							</Button>
							<Button
								className="flex h-auto items-center rounded border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 text-xs shadow-sm transition-all hover:border-blue-500 hover:text-blue-600"
								variant="outline"
							>
								<Tag className="mr-2 h-3.5 w-3.5" />
								Print Door Sign
							</Button>
							<Button
								className="flex h-auto items-center rounded border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 text-xs shadow-sm transition-all hover:border-blue-500 hover:text-blue-600"
								variant="outline"
							>
								<UserCheck className="mr-2 h-3.5 w-3.5" />
								Check-in User
							</Button>
						</div>

						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							{/* Dates */}
							<div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
								<div className="px-2 text-center">
									<span className="block font-bold text-[10px] text-slate-400 uppercase">
										Start
									</span>
									<span className="block font-bold text-slate-900">
										{formatDate(workspace.startDate)}
									</span>
								</div>
								<ArrowRight className="h-4 w-4 text-slate-300" />
								<div className="px-2 text-center">
									<span className="block font-bold text-[10px] text-slate-400 uppercase">
										End
									</span>
									<span className="block font-bold text-slate-900">
										{formatDate(workspace.endDate)}
									</span>
								</div>
							</div>

							{/* Equipment */}
							<div>
								<p className="mb-2 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
									Reserved Equipment
								</p>
								<ul className="space-y-1 text-slate-600 text-sm">
									{workspace.equipmentUsages.length > 0 ? (
										workspace.equipmentUsages.map((eu) => (
											<li className="flex items-center" key={eu.equipment.id}>
												<Check className="mr-2 h-3 w-3 text-green-500" />
												{eu.equipment.name}
											</li>
										))
									) : (
										<li className="flex items-center">
											<Check className="mr-2 h-3 w-3 text-green-500" />
											Standard Bench
										</li>
									)}
								</ul>
							</div>
						</div>

						{/* Purpose / Notes */}
						{workspace.purpose && (
							<div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
								<p className="mb-1 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
									Purpose
								</p>
								<p className="text-slate-700 text-sm">{workspace.purpose}</p>
							</div>
						)}

						{workspace.notes && (
							<div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
								<p className="mb-1 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
									Notes
								</p>
								<p className="text-slate-700 text-sm">{workspace.notes}</p>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
