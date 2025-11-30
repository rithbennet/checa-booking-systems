"use client";

/**
 * Result Action Cell Component
 * Handles the download gating logic based on payment status and analysis completion
 *
 * Logic Tree:
 * A) Analysis Not Complete → Disabled "Processing" button with spinner
 * B) Complete BUT Unpaid → Disabled "Locked" button with lock icon & tooltip
 * C) Complete AND Paid → Active "Download" button(s)
 */

import { Download, ExternalLink, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { UserSampleResultRow } from "@/entities/sample-tracking/model/types";
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
	TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";

interface ResultActionCellProps {
	sample: UserSampleResultRow;
}

export function ResultActionCell({ sample }: ResultActionCellProps) {
	const [isDownloading, setIsDownloading] = useState<string | null>(null);

	const isAnalysisComplete =
		sample.status === "analysis_complete" || sample.status === "returned";
	const isPaid = sample.isPaid;
	const hasResults = sample.hasResults;

	// Handle file download
	const handleDownload = async (resultId: string, fileName: string) => {
		setIsDownloading(resultId);
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
		} catch (error) {
			console.error("Download error:", error);
			// Could add toast notification here
		} finally {
			setIsDownloading(null);
		}
	};

	// Scenario A: Analysis Not Complete (still processing)
	if (!isAnalysisComplete) {
		return (
			<div className="flex items-center justify-end gap-2">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className="text-slate-500"
							disabled
							size="sm"
							variant="outline"
						>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Processing
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Analysis is still in progress</p>
					</TooltipContent>
				</Tooltip>
				<ViewDetailsButton bookingId={sample.bookingId} />
			</div>
		);
	}

	// Scenario B: Complete BUT Unpaid (locked)
	if (!isPaid) {
		return (
			<div className="flex items-center justify-end gap-2">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className="cursor-not-allowed border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100"
							disabled
							size="sm"
							variant="outline"
						>
							<Lock className="mr-2 h-4 w-4" />
							Locked
						</Button>
					</TooltipTrigger>
					<TooltipContent className="max-w-xs">
						<p>
							Please verify payment in the Financials tab to unlock this result.
						</p>
					</TooltipContent>
				</Tooltip>
				<ViewDetailsButton bookingId={sample.bookingId} />
			</div>
		);
	}

	// Scenario C: Complete AND Paid
	// Check if there are actually results to download
	if (!hasResults || sample.analysisResults.length === 0) {
		return (
			<div className="flex items-center justify-end gap-2">
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="text-slate-500 text-sm">No files available</span>
					</TooltipTrigger>
					<TooltipContent>
						<p>
							Analysis is complete but no result files have been uploaded yet.
						</p>
					</TooltipContent>
				</Tooltip>
				<ViewDetailsButton bookingId={sample.bookingId} />
			</div>
		);
	}

	// Single result file - show direct download button
	if (sample.analysisResults.length === 1) {
		const result = sample.analysisResults[0];
		if (!result) {
			return null;
		}
		return (
			<div className="flex items-center justify-end gap-2">
				<Button
					className="border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
					disabled={isDownloading === result.id}
					onClick={() => handleDownload(result.id, result.fileName)}
					size="sm"
					variant="outline"
				>
					{isDownloading === result.id ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Download className="mr-2 h-4 w-4" />
					)}
					Download
				</Button>
				<ViewDetailsButton bookingId={sample.bookingId} />
			</div>
		);
	}

	// Multiple result files - show dropdown
	return (
		<div className="flex items-center justify-end gap-2">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						className="border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
						size="sm"
						variant="outline"
					>
						<Download className="mr-2 h-4 w-4" />
						Download ({sample.resultCount})
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{sample.analysisResults.map((result) => (
						<DropdownMenuItem
							className="cursor-pointer"
							disabled={isDownloading === result.id}
							key={result.id}
							onClick={() => handleDownload(result.id, result.fileName)}
						>
							{isDownloading === result.id ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Download className="mr-2 h-4 w-4" />
							)}
							<span className="max-w-[200px] truncate">{result.fileName}</span>
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
			<ViewDetailsButton bookingId={sample.bookingId} />
		</div>
	);
}

/**
 * View Details Button - navigates to booking detail page
 */
function ViewDetailsButton({ bookingId }: { bookingId: string }) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button asChild size="sm" variant="ghost">
					<Link href={`/dashboard/bookings/${bookingId}`}>
						<ExternalLink className="h-4 w-4" />
						<span className="sr-only">View booking details</span>
					</Link>
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<p>View booking details</p>
			</TooltipContent>
		</Tooltip>
	);
}
