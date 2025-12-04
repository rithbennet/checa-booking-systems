/**
 * SampleDetailDrawer Component
 *
 * A slide-over sheet for viewing and managing sample details,
 * including status updates, activity log, file uploads, and internal notes.
 */

"use client";

import type { sample_status_enum } from "generated/prisma";
import { Send, UploadCloud, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { SampleTrackingVM } from "@/entities/booking/model/command-center-types";
import type { SampleStatus } from "@/entities/sample-tracking/model/types";
import { BookingDocUploader } from "@/features/bookings/shared";
import { useUpdateSampleStatus } from "@/features/sample-status-update/model/mutation";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/shadcn/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/shared/ui/shadcn/sheet";
import { Textarea } from "@/shared/ui/shadcn/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { formatDateTime, formatRelativeTime } from "../lib/helpers";

interface SampleDetailDrawerProps {
	sample: SampleTrackingVM | null;
	sampleName?: string;
	bookingId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const STATUS_OPTIONS: { value: sample_status_enum; label: string }[] = [
	{ value: "pending", label: "Pending" },
	{ value: "received", label: "Received" },
	{ value: "in_analysis", label: "In Analysis" },
	{ value: "analysis_complete", label: "Complete" },
	{ value: "return_requested", label: "Return Requested" },
	{ value: "returned", label: "Returned" },
];

interface ActivityLogItem {
	date: string;
	title: string;
	description?: string;
	user?: { firstName: string; lastName: string };
	isCurrent?: boolean;
}

function buildActivityLog(sample: SampleTrackingVM): ActivityLogItem[] {
	const items: ActivityLogItem[] = [];

	if (sample.analysisStartAt) {
		items.push({
			date: sample.analysisStartAt,
			title: "Analysis Started",
			isCurrent: sample.status === "in_analysis",
		});
	}

	if (sample.receivedAt) {
		items.push({
			date: sample.receivedAt,
			title: "Sample Received",
			description: sample.notes ?? undefined,
			user: sample.updatedByUser ?? undefined,
		});
	}

	if (sample.analysisCompleteAt) {
		items.push({
			date: sample.analysisCompleteAt,
			title: "Analysis Complete",
		});
	}

	if (sample.returnRequestedAt) {
		items.push({
			date: sample.returnRequestedAt,
			title: "Return Requested",
		});
	}

	if (sample.returnedAt) {
		items.push({
			date: sample.returnedAt,
			title: "Sample Returned",
		});
	}

	// Sort by date descending (most recent first)
	items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	// Mark the first item as current if none is marked
	if (items.length > 0 && !items.some((i) => i.isCurrent)) {
		const firstItem = items[0];
		if (firstItem) {
			firstItem.isCurrent = true;
		}
	}

	return items;
}

export function SampleDetailDrawer({
	sample,
	sampleName,
	bookingId,
	open,
	onOpenChange,
}: SampleDetailDrawerProps) {
	const [status, setStatus] = useState<sample_status_enum>(
		sample?.status ?? "pending",
	);
	const [note, setNote] = useState("");
	const statusMutation = useUpdateSampleStatus();

	// Sync local status when sample changes
	useEffect(() => {
		if (sample) {
			setStatus(sample.status);
		}
	}, [sample]);

	if (!sample) return null;

	const activityLog = buildActivityLog(sample);

	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			<SheetContent
				className="flex w-full flex-col p-0 md:w-[500px] [&>button]:hidden"
				side="right"
			>
				{/* Header */}
				<SheetHeader className="border-slate-100 border-b bg-slate-50/50 p-6">
					<div className="flex items-start justify-between">
						<div className="space-y-1">
							<span className="rounded bg-slate-200 px-1.5 py-0.5 font-bold font-mono text-[10px] text-slate-500 tracking-wider">
								{sample.sampleIdentifier}
							</span>
							<SheetTitle className="font-bold text-slate-900 text-xl">
								{sampleName ?? "Sample"}
							</SheetTitle>
							<SheetDescription className="sr-only">
								Sample details and management
							</SheetDescription>
							<div className="flex items-center gap-2 pt-1">
								<Select
									disabled={statusMutation.isPending}
									onValueChange={(v) => {
										const newStatus = v as sample_status_enum;
										setStatus(newStatus);
										// Immediately update status via API
										statusMutation.mutate({
											sampleId: sample.id,
											status: newStatus as SampleStatus,
										});
									}}
									value={status}
								>
									<SelectTrigger className="h-auto w-auto rounded border-slate-300 bg-white py-1 pr-6 pl-2 font-medium text-slate-700 text-xs shadow-sm focus:ring-blue-500">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{STATUS_OPTIONS.map((opt) => (
											<SelectItem key={opt.value} value={opt.value}>
												{opt.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{statusMutation.isPending && (
									<span className="text-slate-400 text-xs">Saving...</span>
								)}
							</div>
						</div>
						<button
							className="rounded-full p-2 hover:bg-slate-200"
							onClick={() => onOpenChange(false)}
							type="button"
						>
							<X className="h-5 w-5 text-slate-500" />
						</button>
					</div>
				</SheetHeader>

				{/* Body */}
				<div className="flex-1 space-y-8 overflow-y-auto p-6">
					{/* Result Upload */}
					<div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
						<div className="mb-3 flex items-center justify-between">
							<h3 className="flex items-center gap-2 font-bold text-blue-900 text-sm">
								<UploadCloud className="h-4 w-4" />
								Analysis Result
							</h3>
							<span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-[10px] text-blue-600">
								Required
							</span>
						</div>

						{sample.analysisResults.length > 0 ? (
							<div className="space-y-2">
								{sample.analysisResults.map((result) => (
									<div
										className="flex items-center gap-3 rounded border border-blue-200 bg-white p-2"
										key={result.id}
									>
										<div className="flex-1 overflow-hidden">
											<p className="truncate font-medium text-slate-900 text-xs">
												{result.fileName}
											</p>
											<p className="text-[10px] text-slate-400">
												Uploaded {formatRelativeTime(result.uploadedAt)} by{" "}
												{result.uploadedBy.firstName}{" "}
												{result.uploadedBy.lastName}
											</p>
										</div>
									</div>
								))}
							</div>
						) : (
							<BookingDocUploader
								bookingId={bookingId}
								label="Upload Analysis Result"
								sampleTrackingId={sample.id}
								type="sample_result"
							/>
						)}
					</div>

					{/* Activity Log / Timeline */}
					{activityLog.length > 0 && (
						<div>
							<h3 className="mb-4 font-bold text-slate-900 text-sm">
								Activity Log
							</h3>
							<div className="relative space-y-6 border-slate-100 border-l-2 pl-4">
								{activityLog.map((item) => (
									<div className="relative" key={`${item.title}-${item.date}`}>
										<div
											className={`-left-[21px] absolute top-1.5 h-3 w-3 rounded-full ring-4 ring-white ${item.isCurrent ? "bg-blue-500" : "bg-slate-300"
												}`}
										/>
										<div className="flex items-start justify-between">
											<div>
												<p className="mb-0.5 text-slate-500 text-xs">
													{formatDateTime(item.date)}
												</p>
												<p className="font-medium text-slate-900 text-sm">
													{item.title}
												</p>
												{item.description && (
													<p className="mt-1 rounded border border-slate-100 bg-slate-50 p-2 text-slate-500 text-xs italic">
														"{item.description}"
													</p>
												)}
											</div>
											{item.user && (
												<div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 font-bold text-[10px] text-slate-500">
													{item.user.firstName.charAt(0)}
													{item.user.lastName.charAt(0)}
												</div>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Internal Staff Note */}
					<div>
						<label
							className="mb-2 block font-bold text-slate-900 text-sm"
							htmlFor="internal-note"
						>
							Internal Note
						</label>
						<div className="relative">
							<Textarea
								className="w-full resize-none rounded-lg border-slate-200 p-3 pr-12 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
								id="internal-note"
								onChange={(e) => setNote(e.target.value)}
								placeholder="Type a note..."
								rows={2}
								value={note}
							/>
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										className="absolute right-2 bottom-2 cursor-not-allowed rounded bg-slate-100 p-1.5 text-slate-400"
										type="button"
									>
										<Send className="h-3 w-3" />
									</button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Internal notes coming soon</p>
								</TooltipContent>
							</Tooltip>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="flex gap-3 border-slate-100 border-t bg-slate-50 p-4">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								className="flex-1 cursor-not-allowed rounded-lg border border-slate-200 bg-white py-2.5 font-bold text-slate-400 text-xs shadow-sm"
								disabled
								variant="outline"
							>
								Flag Issue
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Issue flagging coming soon</p>
						</TooltipContent>
					</Tooltip>
					<Button
						className="flex-1 rounded-lg bg-slate-900 py-2.5 font-bold text-white text-xs shadow-sm transition-colors hover:bg-slate-800"
						onClick={() => onOpenChange(false)}
					>
						Close
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	);
}
