"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/shadcn/select";
import type { AdminBookingTypeFilter } from "../model/admin-list.types";

interface AdminTypeFilterProps {
	value: AdminBookingTypeFilter;
	onChange: (value: AdminBookingTypeFilter) => void;
}

export function AdminTypeFilter({ value, onChange }: AdminTypeFilterProps) {
	return (
		<Select onValueChange={onChange} value={value}>
			<SelectTrigger className="w-[180px]">
				<SelectValue placeholder="Filter by type..." />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="all">
					<div className="flex items-center gap-2">
						<div className="size-2 rounded-full bg-blue-500" />
						<span>All Types</span>
					</div>
				</SelectItem>
				<SelectItem value="analysis_only">
					<div className="flex items-center gap-2">
						<div className="size-2 rounded-full bg-purple-500" />
						<span>Analysis Only</span>
					</div>
				</SelectItem>
				<SelectItem value="workspace_only">
					<div className="flex items-center gap-2">
						<div className="size-2 rounded-full bg-green-500" />
						<span>Workspace Only</span>
					</div>
				</SelectItem>
				<SelectItem value="internal">
					<div className="flex items-center gap-2">
						<div className="size-2 rounded-full bg-indigo-500" />
						<span>Internal</span>
					</div>
				</SelectItem>
				<SelectItem value="external">
					<div className="flex items-center gap-2">
						<div className="size-2 rounded-full bg-slate-500" />
						<span>External</span>
					</div>
				</SelectItem>
			</SelectContent>
		</Select>
	);
}
