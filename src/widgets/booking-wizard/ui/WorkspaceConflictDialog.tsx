"use client";

import { AlertTriangle, Calendar, X } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/shared/ui/shadcn/alert-dialog";

export interface WorkspaceConflict {
	id: string;
	startDate: Date | string;
	endDate: Date | string;
	bookingRequestId: string;
}

export interface ConflictData {
	proposedStartDate: string;
	proposedEndDate: string;
	existingBookings: WorkspaceConflict[];
}

interface WorkspaceConflictDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	conflicts: ConflictData[];
}

function formatDate(date: Date | string): string {
	return new Date(date).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export function WorkspaceConflictDialog({
	open,
	onOpenChange,
	conflicts,
}: WorkspaceConflictDialogProps) {
	if (!conflicts || conflicts.length === 0) {
		return null;
	}

	return (
		<AlertDialog onOpenChange={onOpenChange} open={open}>
			<AlertDialogContent className="max-w-lg">
				<AlertDialogHeader>
					<div className="mb-2 flex items-center gap-2">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
							<AlertTriangle className="h-5 w-5 text-amber-600" />
						</div>
						<AlertDialogTitle className="text-xl">
							Workspace Booking Conflict
						</AlertDialogTitle>
					</div>
					<AlertDialogDescription className="text-left">
						Your requested workspace dates overlap with existing bookings.
						Please adjust your dates or cancel the conflicting booking first.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="my-4 max-h-64 space-y-4 overflow-y-auto">
					{conflicts.map((conflict) => (
						<div
							className="rounded-lg border border-amber-200 bg-amber-50 p-4"
							key={`${conflict.proposedStartDate}-${conflict.proposedEndDate}`}
						>
							<div className="mb-3 flex items-center gap-2">
								<Calendar className="h-4 w-4 text-amber-600" />
								<span className="font-medium text-amber-900 text-sm">
									Your requested dates:
								</span>
							</div>
							<div className="mb-3 rounded-md bg-white px-3 py-2 text-sm">
								{formatDate(conflict.proposedStartDate)} –{" "}
								{formatDate(conflict.proposedEndDate)}
							</div>

							<div className="mb-2 flex items-center gap-2">
								<X className="h-4 w-4 text-red-500" />
								<span className="font-medium text-red-700 text-sm">
									Conflicts with:
								</span>
							</div>
							<div className="space-y-2">
								{conflict.existingBookings.map((existing) => (
									<div
										className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm"
										key={existing.id}
									>
										<span className="text-red-800">
											{formatDate(existing.startDate)} –{" "}
											{formatDate(existing.endDate)}
										</span>
										<a
											className="font-medium text-blue-600 text-xs hover:underline"
											href={`/bookings/${existing.bookingRequestId}`}
											rel="noopener noreferrer"
											target="_blank"
										>
											View booking
										</a>
									</div>
								))}
							</div>
						</div>
					))}
				</div>

				<AlertDialogFooter>
					<AlertDialogAction onClick={() => onOpenChange(false)}>
						Adjust Dates
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
