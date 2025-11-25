/**
 * ServiceItemAccordion Component
 *
 * Collapsible accordion for displaying service items with:
 * - Tech specs grid
 * - Sample table
 * - Status indicators
 */

"use client";

import type {
	sample_status_enum,
	service_category_enum,
} from "generated/prisma";
import {
	Activity,
	Beaker,
	ChevronDown,
	ChevronRight,
	Waves,
	Zap,
} from "lucide-react";
import { useState } from "react";
import type {
	SampleTrackingVM,
	ServiceItemVM,
} from "@/entities/booking/model/command-center-types";
import type { SampleStatus } from "@/entities/sample-tracking/model/types";
import { useUpdateSampleStatus } from "@/features/sample-status-update/model/mutation";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/shadcn/select";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { formatCurrency } from "../lib/helpers";

interface ServiceItemAccordionProps {
	serviceItem: ServiceItemVM;
	onSampleClick?: (sample: SampleTrackingVM) => void;
	onRequestModification?: (serviceItem: ServiceItemVM) => void;
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

// Get sample status badge config
function getSampleStatusConfig(status: sample_status_enum) {
	switch (status) {
		case "pending":
			return { label: "Pending", className: "bg-slate-100 text-slate-600" };
		case "received":
			return { label: "Received", className: "bg-blue-100 text-blue-700" };
		case "in_analysis":
			return {
				label: "In Analysis",
				className: "bg-yellow-100 text-yellow-800",
			};
		case "analysis_complete":
			return {
				label: "Complete",
				className: "bg-green-100 text-green-700",
			};
		case "return_requested":
			return {
				label: "Return Req.",
				className: "bg-purple-100 text-purple-700",
			};
		case "returned":
			return { label: "Returned", className: "bg-gray-100 text-gray-600" };
		default:
			return { label: status, className: "bg-slate-100 text-slate-600" };
	}
}

// Get overall service item status
function getItemStatus(item: ServiceItemVM): {
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
			label: "Processing",
			className: "bg-purple-50 text-purple-700 border-purple-200",
		};
	}
	if (statuses.every((s) => s === "received")) {
		return { label: "Received", className: "bg-blue-100 text-blue-700" };
	}
	if (statuses.some((s) => s === "pending")) {
		return { label: "Pending", className: "bg-slate-100 text-slate-600" };
	}

	return { label: "Queued", className: "bg-slate-100 text-slate-600" };
}

// Get tech specs to display based on service category
function getTechSpecs(item: ServiceItemVM) {
	const specs: { label: string; value: string }[] = [];
	const category = item.service.category;

	if (category === "ftir_atr" || category === "ftir_kbr") {
		specs.push({ label: "Range", value: "4000-400 cm⁻¹" });
		specs.push({ label: "Resolution", value: "4 cm⁻¹" });
		if (item.testingMethod) {
			specs.push({ label: "Method", value: item.testingMethod });
		}
	}

	if (category === "hplc_pda") {
		if (item.columnType) {
			specs.push({ label: "Column", value: item.columnType });
		}
		if (item.flowRate && item.flowRate !== "0") {
			specs.push({ label: "Flow Rate", value: `${item.flowRate} mL/min` });
		}
		if (item.solventSystem) {
			specs.push({ label: "Solvent System", value: item.solventSystem });
		}
		if (item.wavelength) {
			specs.push({ label: "Wavelength", value: `${item.wavelength} nm` });
		}
	}

	if (category === "uv_vis_absorbance" || category === "uv_vis_reflectance") {
		if (item.wavelength) {
			specs.push({ label: "Wavelength", value: `${item.wavelength} nm` });
		}
		if (item.testingMethod) {
			specs.push({ label: "Method", value: item.testingMethod });
		}
	}

	if (category === "bet_analysis") {
		if (item.degasConditions) {
			specs.push({ label: "Degas Conditions", value: item.degasConditions });
		}
		if (item.samplePreparation) {
			specs.push({ label: "Preparation", value: item.samplePreparation });
		}
	}

	return specs;
}

// Sample status options for inline dropdown
const SAMPLE_STATUS_OPTIONS: { value: SampleStatus; label: string }[] = [
	{ value: "pending", label: "Pending" },
	{ value: "received", label: "Received" },
	{ value: "in_analysis", label: "In Analysis" },
	{ value: "analysis_complete", label: "Complete" },
	{ value: "return_requested", label: "Return Requested" },
	{ value: "returned", label: "Returned" },
];

// Inline SampleRow component with status dropdown
function SampleRow({
	sample,
	sampleName,
	hazardousMaterial,
	onSampleClick,
}: {
	sample: SampleTrackingVM;
	sampleName: string | null;
	hazardousMaterial: boolean;
	onSampleClick?: (sample: SampleTrackingVM) => void;
}) {
	const mutation = useUpdateSampleStatus();
	const sampleStatus = getSampleStatusConfig(sample.status);

	const handleStatusChange = (newStatus: string) => {
		mutation.mutate({
			sampleId: sample.id,
			status: newStatus as SampleStatus,
		});
	};

	return (
		<tr className="hover:bg-slate-50">
			<td className="px-6 py-3 font-bold font-mono text-slate-600 text-xs">
				{sample.sampleIdentifier}
			</td>
			<td className="px-6 py-3">
				{sampleName ?? "Sample"}
				{hazardousMaterial && (
					<span className="ml-2 font-bold text-orange-500 text-xs">
						Flammable
					</span>
				)}
			</td>
			<td className="px-6 py-3">
				<Select
					disabled={mutation.isPending}
					onValueChange={handleStatusChange}
					value={sample.status}
				>
					<SelectTrigger className="h-8 w-[140px] border-slate-200 text-xs">
						<SelectValue>
							<Badge
								className={cn(sampleStatus.className, "text-xs")}
								variant="outline"
							>
								{sampleStatus.label}
							</Badge>
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{SAMPLE_STATUS_OPTIONS.map((opt) => (
							<SelectItem className="text-xs" key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</td>
			<td className="px-6 py-3 text-right">
				<Button
					className="h-7 gap-1 rounded-md border-slate-200 px-2 text-xs"
					onClick={() => onSampleClick?.(sample)}
					size="sm"
					variant="outline"
				>
					View Details
					<ChevronRight className="h-3 w-3" />
				</Button>
			</td>
		</tr>
	);
}

export function ServiceItemAccordion({
	serviceItem,
	onSampleClick,
	onRequestModification,
}: ServiceItemAccordionProps) {
	const [isOpen, setIsOpen] = useState(true);

	const colors = getCategoryColor(serviceItem.service.category);
	const itemStatus = getItemStatus(serviceItem);
	const techSpecs = getTechSpecs(serviceItem);

	const sampleCount = serviceItem.sampleTracking.length;
	const sampleText = sampleCount === 1 ? "1 Sample" : `${sampleCount} Samples`;

	// Build subtitle with additional info
	let subtitle = sampleText;
	if (serviceItem.testingMethod) {
		subtitle += ` • ${serviceItem.testingMethod}`;
	} else if (
		serviceItem.service.category === "ftir_atr" ||
		serviceItem.service.category === "ftir_kbr"
	) {
		subtitle += " • ATR Mode";
	}

	return (
		<div
			className={cn(
				"overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
				isOpen && "accordion-open",
			)}
		>
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
						<p className="text-slate-500 text-xs">{subtitle}</p>
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
					{/* Pricing & Modification Section */}
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
									Unit Price
								</p>
								<p className="font-semibold text-slate-900">
									{formatCurrency(serviceItem.unitPrice)}
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
						<Button
							className="h-8 gap-1 text-xs"
							onClick={() => onRequestModification?.(serviceItem)}
							size="sm"
							variant="outline"
						>
							Request Modification
						</Button>
					</div>

					{/* Tech Specs Grid */}
					{techSpecs.length > 0 && (
						<div className="grid grid-cols-2 gap-4 border-slate-200/60 border-b p-5 md:grid-cols-4">
							{techSpecs.map((spec) => (
								<div key={spec.label}>
									<p className="mb-1 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
										{spec.label}
									</p>
									<p className="font-mono font-semibold text-slate-900 text-sm">
										{spec.value}
									</p>
								</div>
							))}
							<div className="col-span-2 flex items-end justify-end">
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											className="cursor-not-allowed font-medium text-slate-400 text-xs"
											type="button"
										>
											Edit Parameters
										</button>
									</TooltipTrigger>
									<TooltipContent>
										<p>Parameter editing coming soon</p>
									</TooltipContent>
								</Tooltip>
							</div>
						</div>
					)}

					{/* Sample Table */}
					{serviceItem.sampleTracking.length > 0 && (
						<div className="bg-white">
							<table className="w-full text-left text-sm">
								<thead className="border-slate-200 border-b bg-slate-50 text-slate-500">
									<tr>
										<th className="px-6 py-2 font-bold text-xs uppercase">
											ID
										</th>
										<th className="px-6 py-2 font-bold text-xs uppercase">
											Details
										</th>
										<th className="px-6 py-2 font-bold text-xs uppercase">
											Status
										</th>
										<th className="px-6 py-2 text-right font-bold text-xs uppercase">
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{serviceItem.sampleTracking.map((sample) => (
										<SampleRow
											hazardousMaterial={serviceItem.hazardousMaterial}
											key={sample.id}
											onSampleClick={onSampleClick}
											sample={sample}
											sampleName={serviceItem.sampleName}
										/>
									))}
								</tbody>
							</table>
						</div>
					)}

					{/* Empty state for no samples */}
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
