"use client";

import { Loader2, RefreshCw } from "lucide-react";
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
import { SORT_OPTIONS } from "../lib/tableConfig";
import type { SortKey } from "../model/filters.schema";

interface ActionBarProps {
	sortValue: SortKey;
	onSortChange: (value: SortKey) => void;
	onRefresh: () => void;
	isRefreshing: boolean;
}

export function ActionBar({
	sortValue,
	onSortChange,
	onRefresh,
	isRefreshing,
}: ActionBarProps) {
	return (
		<div className="flex items-center gap-2">
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						disabled={isRefreshing}
						onClick={onRefresh}
						size="icon"
						variant="outline"
					>
						{isRefreshing ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<RefreshCw className="size-4" />
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					{isRefreshing ? "Refreshing data..." : "Refresh list"}
				</TooltipContent>
			</Tooltip>
			<Select onValueChange={onSortChange} value={sortValue}>
				<SelectTrigger className="w-[200px]">
					<SelectValue placeholder="Sort by" />
				</SelectTrigger>
				<SelectContent>
					{SORT_OPTIONS.map((opt) => (
						<SelectItem key={opt.value} value={opt.value}>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
