/**
 * UserServiceItemCard Component
 *
 * Displays service item details with sample tracking information.
 */

"use client";

import type { service_category_enum } from "generated/prisma";
import {
	Activity,
	Beaker,
	ChevronDown,
	ChevronRight,
	FileText,
	Lock,
	Waves,
	Zap,
} from "lucide-react";
import { useState } from "react";
import type {
	UserSampleTrackingVM,
	UserServiceItemVM,
} from "@/entities/booking/model/user-detail-types";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	formatCurrency,
	getSampleStatusColor,
	getSampleStatusLabel,
} from "../lib/helpers";

interface UserServiceItemCardProps {
	serviceItem: UserServiceItemVM;
	canDownloadResults: boolean;
	onSampleClick?: (sample: UserSampleTrackingVM) => void;
}

// Get icon based on service category
function getServiceIcon(category: service_category_enum) {
	switch (category) {
		case "ftir_atr":
		case "ftir_kbr":
			return <Waves className="h-5 w-5" />;
		case "hplc_pda":
			return <Activity className="h-5 w-5" />;
		case "uv_vis_absorbance":
		case "uv_vis_reflectance":
			return <Zap className="h-5 w-5" />;
		case "bet_analysis":
			return <Beaker className="h-5 w-5" />;
		default:
			return <Activity className="h-5 w-5" />;
	}
}

// Get color based on service category
function getCategoryColor(category: service_category_enum) {
	switch (category) {
		case "ftir_atr":
		case "ftir_kbr":
			return {
				border: "border-l-purple-500",
				bg: "bg-purple-50",
				text: "text-purple-600",
			};
		case "hplc_pda":
			return {
				border: "border-l-indigo-500",
				bg: "bg-indigo-50",
				text: "text-indigo-600",
			};
		case "uv_vis_absorbance":
		case "uv_vis_reflectance":
			return {
				border: "border-l-blue-500",
				bg: "bg-blue-50",
				text: "text-blue-600",
			};
		case "bet_analysis":
			return {
				border: "border-l-teal-500",
				bg: "bg-teal-50",
				text: "text-teal-600",
			};
		default:
			return {
				border: "border-l-slate-500",
				bg: "bg-slate-50",
				text: "text-slate-600",
			};
	}
}

// Get overall service item status
function getItemStatus(item: UserServiceItemVM): {
	label: string;
	className: string;
} {
	if (item.sampleTracking.length === 0) {
		return { label: "No Samples", className: "bg-slate-100 text-slate-600" };
	}

	const statuses = item.sampleTracking.map((s) => s.status);

	if (statuses.every((s) => s === "analysis_complete" || s === "returned")) {
		return { label: "Completed", className: "bg-green-100 text-green-700" };
	}
	if (statuses.some((s) => s === "in_analysis")) {
		return {
			label: "In Progress",
			className: "bg-purple-50 text-purple-700 border-purple-200",
		};
	}
	if (statuses.every((s) => s === "received")) {
		return { label: "Received", className: "bg-blue-100 text-blue-700" };
	}
	if (statuses.some((s) => s === "pending")) {
		return {
			label: "Awaiting Samples",
			className: "bg-slate-100 text-slate-600",
		};
	}

	return { label: "Queued", className: "bg-slate-100 text-slate-600" };
}

export function UserServiceItemCard({
	serviceItem,
	canDownloadResults,
	onSampleClick,
}: UserServiceItemCardProps) {
	const [isOpen, setIsOpen] = useState(true);

	const colors = getCategoryColor(serviceItem.service.category);
	const itemStatus = getItemStatus(serviceItem);

	const sampleCount = serviceItem.sampleTracking.length;
	const completedCount = serviceItem.sampleTracking.filter(
		(s) => s.status === "analysis_complete" || s.status === "returned",
	).length;

	return (
		<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
			{/* Header */}
			<button
				className={cn(
					"flex w-full cursor-pointer items-center justify-between border-l-4 p-5 transition-colors hover:bg-slate-50",
					colors.border,
				)}
				onClick={() => setIsOpen(!isOpen)}
				type="button"
			>
				<div className="flex items-center gap-4">
					<div
						className={cn(
							"flex h-10 w-10 items-center justify-center rounded-lg",
							colors.bg,
							colors.text,
						)}
					>
						{getServiceIcon(serviceItem.service.category)}
					</div>
					<div className="text-left">
						<h3 className="font-bold text-slate-900">
							{serviceItem.service.name}
						</h3>
						<p className="text-slate-500 text-xs">
							{sampleCount} {sampleCount === 1 ? "sample" : "samples"}
							{completedCount > 0 && ` • ${completedCount} completed`}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-4">
					<Badge className={itemStatus.className} variant="outline">
						{itemStatus.label}
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
					{/* Pricing Section */}
					<div className="flex items-center justify-between border-slate-200/60 border-b bg-white p-4">
						<div className="flex items-center gap-6">
							<div>
								<p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">
									Quantity
								</p>
								<p className="font-semibold text-slate-900">
									{serviceItem.quantity}{" "}
									{serviceItem.quantity === 1 ? "sample" : "samples"}
								</p>
							</div>
							<div>
								<p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">
									Total
								</p>
								<p className="font-bold text-slate-900">
									{formatCurrency(serviceItem.totalPrice)}
								</p>
							</div>
						</div>
					</div>

					{/* Sample Table */}
					{serviceItem.sampleTracking.length > 0 && (
						<div className="bg-white">
							<table className="w-full text-left text-sm">
								<thead className="border-slate-200 border-b bg-slate-50 text-slate-500">
									<tr>
										<th className="px-6 py-2 font-bold text-xs uppercase">
											Sample ID
										</th>
										<th className="px-6 py-2 font-bold text-xs uppercase">
											Name
										</th>
										<th className="px-6 py-2 font-bold text-xs uppercase">
											Status
										</th>
										<th className="px-6 py-2 text-right font-bold text-xs uppercase">
											Results
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{serviceItem.sampleTracking.map((sample) => (
										<tr className="hover:bg-slate-50" key={sample.id}>
											<td className="px-6 py-3 font-bold font-mono text-slate-600 text-xs">
												{sample.sampleIdentifier}
											</td>
											<td className="px-6 py-3 text-slate-900 text-sm">
												{serviceItem.sampleName ?? "Sample"}
											</td>
											<td className="px-6 py-3">
												<Badge
													className={getSampleStatusColor(sample.status)}
													variant="outline"
												>
													{getSampleStatusLabel(sample.status)}
												</Badge>
											</td>
											<td className="px-6 py-3 text-right">
												{sample.analysisResults.length > 0 ? (
													canDownloadResults ? (
														<Button
															className="h-7 gap-1 rounded-md border-slate-200 px-2 text-xs"
															onClick={() => onSampleClick?.(sample)}
															size="sm"
															variant="outline"
														>
															<FileText className="h-3 w-3" />
															{sample.analysisResults.length} file
															{sample.analysisResults.length !== 1 && "s"}
															<ChevronRight className="h-3 w-3" />
														</Button>
													) : (
														<span className="flex items-center justify-end gap-1 text-slate-400 text-xs">
															<Lock className="h-3 w-3" />
															Pay to unlock
														</span>
													)
												) : (
													<span className="text-slate-400 text-xs">
														No results yet
													</span>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}

					{/* Empty state */}
					{serviceItem.sampleTracking.length === 0 && (
						<div className="p-8 text-center text-slate-500 text-sm">
							No samples registered for this service item
						</div>
					)}
				</div>
			)}
		</div>
	);
}
