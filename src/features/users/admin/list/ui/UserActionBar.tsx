"use client";

import { Loader2, RefreshCw } from "lucide-react";
import type { UserSortKey } from "@/entities/user/model/types";
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

interface UserActionBarProps {
	sortValue: UserSortKey;
	onSortChange: (value: UserSortKey) => void;
	onRefresh: () => void;
	isRefreshing: boolean;
}

const SORT_OPTIONS: Array<{ value: UserSortKey; label: string }> = [
	{ value: "created_newest", label: "Newest First" },
	{ value: "created_oldest", label: "Oldest First" },
	{ value: "name_asc", label: "Name (A-Z)" },
	{ value: "name_desc", label: "Name (Z-A)" },
];

export function UserActionBar({
	sortValue,
	onSortChange,
	onRefresh,
	isRefreshing,
}: UserActionBarProps) {
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
					{isRefreshing ? "Refreshing..." : "Refresh list"}
				</TooltipContent>
			</Tooltip>
			<Select onValueChange={onSortChange} value={sortValue}>
				<SelectTrigger className="w-40">
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
