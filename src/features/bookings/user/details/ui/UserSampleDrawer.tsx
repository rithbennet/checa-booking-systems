/**
 * UserSampleDrawer Component
 *
 * Drawer for viewing sample details and downloading results.
 */

"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserSampleTrackingVM } from "@/entities/booking/model/user-detail-types";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/shared/ui/shadcn/sheet";
import {
	formatDateTime,
	getSampleStatusColor,
	getSampleStatusLabel,
} from "../lib/helpers";

interface UserSampleDrawerProps {
	sample: UserSampleTrackingVM | null;
	sampleName?: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	canDownload: boolean;
}

export function UserSampleDrawer({
	sample,
	sampleName,
	open,
	onOpenChange,
	canDownload,
}: UserSampleDrawerProps) {
	const [downloadingId, setDownloadingId] = useState<string | null>(null);

	if (!sample) return null;

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	const handleDownload = async (resultId: string, fileName: string) => {
		setDownloadingId(resultId);
		try {
			const response = await fetch(`/api/downloads/result/${resultId}`);

			if (!response.ok) {
				const error = await response.json().catch(() => ({}));
				throw new Error(error.error || "Download failed");
			}

			// Create blob and trigger download
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			toast.success("Download started", {
				description: fileName,
			});
		} catch (error) {
			toast.error("Download failed", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		} finally {
			setDownloadingId(null);
		}
	};

	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			<SheetContent className="w-full overflow-y-auto sm:max-w-lg">
				<SheetHeader>
					<div className="flex items-center justify-between">
						<div>
							<SheetTitle className="flex items-center gap-2">
								{sample.sampleIdentifier}
								<Badge
									className={getSampleStatusColor(sample.status)}
									variant="outline"
								>
									{getSampleStatusLabel(sample.status)}
								</Badge>
							</SheetTitle>
							<SheetDescription>
								{sampleName ?? "Sample"} details and results
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				<div className="mt-6 px-6">
					{/* Timeline */}
					<div className="">
						<h3 className="font-semibold text-slate-900 text-sm">Timeline</h3>
						<div className="space-y-2 text-sm">
							{sample.receivedAt && (
								<div className="flex items-center justify-between">
									<span className="text-slate-500">Received</span>
									<span className="text-slate-900">
										{formatDateTime(sample.receivedAt)}
									</span>
								</div>
							)}
							{sample.analysisStartAt && (
								<div className="flex items-center justify-between">
									<span className="text-slate-500">Analysis Started</span>
									<span className="text-slate-900">
										{formatDateTime(sample.analysisStartAt)}
									</span>
								</div>
							)}
							{sample.analysisCompleteAt && (
								<div className="flex items-center justify-between">
									<span className="text-slate-500">Analysis Complete</span>
									<span className="text-slate-900">
										{formatDateTime(sample.analysisCompleteAt)}
									</span>
								</div>
							)}
							{sample.returnRequestedAt && (
								<div className="flex items-center justify-between">
									<span className="text-slate-500">Return Requested</span>
									<span className="text-slate-900">
										{formatDateTime(sample.returnRequestedAt)}
									</span>
								</div>
							)}
							{sample.returnedAt && (
								<div className="flex items-center justify-between">
									<span className="text-slate-500">Returned</span>
									<span className="text-slate-900">
										{formatDateTime(sample.returnedAt)}
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Notes */}
					{sample.notes && (
						<div className="space-y-2">
							<h3 className="font-semibold text-slate-900 text-sm">Notes</h3>
							<p className="rounded-lg bg-slate-50 p-3 text-slate-700 text-sm">
								{sample.notes}
							</p>
						</div>
					)}

					{/* Analysis Results */}
					<div className="space-y-3">
						<h3 className="font-semibold text-slate-900 text-sm">
							Analysis Results
						</h3>
						{sample.analysisResults.length > 0 ? (
							<div className="space-y-2">
								{sample.analysisResults.map((result) => (
									<div
										className="flex items-center justify-between rounded-lg border p-3"
										key={result.id}
									>
										<div className="flex items-center gap-3">
											<FileText className="h-5 w-5 text-slate-400" />
											<div>
												<p className="font-medium text-slate-900 text-sm">
													{result.fileName}
												</p>
												<p className="text-slate-500 text-xs">
													{formatFileSize(result.fileSize)} •{" "}
													{formatDateTime(result.uploadedAt)}
												</p>
												{result.description && (
													<p className="mt-1 text-slate-600 text-xs">
														{result.description}
													</p>
												)}
											</div>
										</div>
										{canDownload ? (
											<Button
												disabled={downloadingId === result.id}
												onClick={() =>
													handleDownload(result.id, result.fileName)
												}
												size="sm"
												variant="outline"
											>
												{downloadingId === result.id ? (
													<Loader2 className="mr-1 h-4 w-4 animate-spin" />
												) : (
													<Download className="mr-1 h-4 w-4" />
												)}
												Download
											</Button>
										) : (
											<span className="text-slate-400 text-xs">
												Pay to unlock
											</span>
										)}
									</div>
								))}
							</div>
						) : (
							<p className="text-center text-slate-500 text-sm">
								No results available yet
							</p>
						)}
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
