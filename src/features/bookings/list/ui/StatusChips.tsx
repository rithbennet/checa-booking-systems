"use client";

import { ChevronDown } from "lucide-react";
import {
	getStatusBadgeClassName,
	getStatusColors,
} from "@/shared/lib/status-utils";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shared/ui/shadcn/popover";

type Counts = {
	all: number;
	draft: number;
	pending_user_verification: number;
	pending_approval: number;
	approved: number;
	rejected: number;
	in_progress: number;
	completed: number;
	cancelled: number;
};

export function StatusChips({
	counts,
	active,
	onChange,
}: {
	counts?: Counts;
	active: string[] | undefined;
	onChange: (next: string[] | undefined) => void;
}) {
	// Single-select grouping behavior to keep URL clean
	const isAll = !active || active.length === 0;
	const isDraft = active?.length === 1 && active[0] === "draft";
	const isPending =
		Array.isArray(active) &&
		active.length === 2 &&
		active.includes("pending_user_verification") &&
		active.includes("pending_approval");
	const isApproved = active?.length === 1 && active[0] === "approved";
	const isInProgress = active?.length === 1 && active[0] === "in_progress";
	const isCompleted = active?.length === 1 && active[0] === "completed";
	const isRejected = active?.length === 1 && active[0] === "rejected";
	const isCancelled = active?.length === 1 && active[0] === "cancelled";

	const pendingCount = counts
		? counts.pending_user_verification + counts.pending_approval
		: undefined;

	const getMoreStatusLabel = () => {
		if (isInProgress) return "In Progress";
		if (isCompleted) return "Completed";
		if (isRejected) return "Rejected";
		if (isCancelled) return "Cancelled";
		return "More statuses";
	};

	return (
		<div className="flex flex-wrap items-center gap-2">
			{/* Primary filters - always visible */}
			<Badge
				className={
					isAll
						? "rounded-full bg-slate-100 text-slate-800 ring-2 ring-slate-500 transition-all hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-100"
						: "cursor-pointer rounded-full bg-gray-100 text-gray-700 transition-all hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
				}
				onClick={() => onChange(undefined)}
				variant="secondary"
			>
				All {counts ? `(${counts.all})` : ""}
			</Badge>
			<Badge
				className={
					isDraft
						? `${getStatusBadgeClassName("draft")} ring-2 ${getStatusColors("draft").ring
						} transition-all`
						: "cursor-pointer rounded-full bg-gray-100 text-gray-700 transition-all hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
				}
				onClick={() => onChange(["draft"])}
				variant="secondary"
			>
				Draft {counts ? `(${counts.draft})` : ""}
			</Badge>
			<Badge
				className={
					isPending
						? `${getStatusBadgeClassName("pending_user_verification")} ring-2 ${getStatusColors("pending_user_verification").ring
						} transition-all`
						: "cursor-pointer rounded-full bg-gray-100 text-gray-700 transition-all hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
				}
				onClick={() =>
					onChange(["pending_user_verification", "pending_approval"])
				}
				variant="secondary"
			>
				Pending {pendingCount !== undefined ? `(${pendingCount})` : ""}
			</Badge>
			<Badge
				className={
					isApproved
						? `${getStatusBadgeClassName("approved")} ring-2 ${getStatusColors("approved").ring
						} transition-all`
						: "cursor-pointer rounded-full bg-gray-100 text-gray-700 transition-all hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
				}
				onClick={() => onChange(["approved"])}
				variant="secondary"
			>
				Approved {counts ? `(${counts.approved})` : ""}
			</Badge>

			{/* "More statuses" dropdown */}
			<Popover>
				<PopoverTrigger asChild>
					{
						// Compute a class for the popover trigger so it reflects the
						// currently-selected status colour when one of the "more"
						// statuses is active.
					}
					<Badge
						className={`cursor-pointer ${isInProgress
								? `${getStatusBadgeClassName("in_progress")} ring-2 ${getStatusColors("in_progress").ring
								}`
								: isCompleted
									? `${getStatusBadgeClassName("completed")} ring-2 ${getStatusColors("completed").ring
									}`
									: isRejected
										? `${getStatusBadgeClassName("rejected")} ring-2 ${getStatusColors("rejected").ring
										}`
										: isCancelled
											? `${getStatusBadgeClassName("cancelled")} ring-2 ${getStatusColors("cancelled").ring
											}`
											: "rounded-full bg-gray-100 text-gray-700"
							} transition-all hover:opacity-90`}
						variant="secondary"
					>
						{getMoreStatusLabel()} <ChevronDown className="ml-1 size-3" />
					</Badge>
				</PopoverTrigger>
				<PopoverContent align="start" className="w-48 p-2">
					<div className="space-y-1">
						<Button
							className={
								isInProgress
									? `w-full justify-between font-medium ${getStatusColors("in_progress").bg
									} ${getStatusColors("in_progress").text} hover:opacity-95`
									: "w-full justify-between"
							}
							onClick={() => onChange(["in_progress"])}
							size="sm"
							variant="ghost"
						>
							<span>In Progress</span>
							{counts && (
								<span className="text-muted-foreground">
									({counts.in_progress})
								</span>
							)}
						</Button>
						<Button
							className={
								isCompleted
									? `w-full justify-between font-medium ${getStatusColors("completed").bg
									} ${getStatusColors("completed").text} hover:opacity-95`
									: "w-full justify-between"
							}
							onClick={() => onChange(["completed"])}
							size="sm"
							variant="ghost"
						>
							<span>Completed</span>
							{counts && (
								<span className="text-muted-foreground">
									({counts.completed})
								</span>
							)}
						</Button>
						<Button
							className={
								isRejected
									? `w-full justify-between font-medium ${getStatusColors("rejected").bg
									} ${getStatusColors("rejected").text} hover:opacity-95`
									: "w-full justify-between"
							}
							onClick={() => onChange(["rejected"])}
							size="sm"
							variant="ghost"
						>
							<span>Rejected</span>
							{counts && (
								<span className="text-muted-foreground">
									({counts.rejected})
								</span>
							)}
						</Button>
						<Button
							className={
								isCancelled
									? `w-full justify-between font-medium ${getStatusColors("cancelled").bg
									} ${getStatusColors("cancelled").text} hover:opacity-95`
									: "w-full justify-between"
							}
							onClick={() => onChange(["cancelled"])}
							size="sm"
							variant="ghost"
						>
							<span>Cancelled</span>
							{counts && (
								<span className="text-muted-foreground">
									({counts.cancelled})
								</span>
							)}
						</Button>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
