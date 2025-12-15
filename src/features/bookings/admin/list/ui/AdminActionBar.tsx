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
import { ADMIN_SORT_OPTIONS } from "../model/admin-list.constants";
import type { AdminSortKey } from "../model/admin-list.types";

interface AdminActionBarProps {
	sortValue: AdminSortKey;
	onSortChange: (value: AdminSortKey) => void;
	onRefresh: () => void;
	isRefreshing: boolean;
}

export function AdminActionBar({
	sortValue,
	onSortChange,
	onRefresh,
	isRefreshing,
}: AdminActionBarProps) {
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
					<p>Refresh list</p>
				</TooltipContent>
			</Tooltip>

			<Select onValueChange={onSortChange} value={sortValue}>
				<SelectTrigger className="w-[180px]">
					<SelectValue placeholder="Sort by..." />
				</SelectTrigger>
				<SelectContent>
					{ADMIN_SORT_OPTIONS.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
