"use client";

import { Search, X } from "lucide-react";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import { Input } from "@/shared/ui/shadcn/input";
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
import type { ActionDef, DataTableToolbarProps, FilterDef } from "./types";

/**
 * Renders a single filter based on its type
 */
function FilterRenderer({ filter }: { filter: FilterDef }) {
	switch (filter.type) {
		case "select":
			return (
				<Select
					onValueChange={(v) =>
						filter.onChange(v === "__all__" ? undefined : v)
					}
					value={(filter.value as string) || "__all__"}
				>
					<SelectTrigger className={filter.className || "w-[180px]"}>
						<SelectValue placeholder={filter.placeholder || filter.label} />
					</SelectTrigger>
					<SelectContent>
						{filter.options?.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								<div className="flex items-center gap-2">
									{option.icon}
									<span>{option.label}</span>
									{option.count !== undefined && (
										<span className="text-muted-foreground">
											({option.count})
										</span>
									)}
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			);

		case "chips":
			return (
				<div className="flex flex-wrap items-center gap-2">
					{filter.options?.map((option) => {
						const isActive = Array.isArray(filter.value)
							? filter.value.includes(option.value)
							: filter.value === option.value;

						return (
							<Badge
								className={`cursor-pointer rounded-full transition-all ${
									isActive ? "ring-2 ring-primary" : "hover:bg-muted"
								}`}
								key={option.value}
								onClick={() => filter.onChange(option.value)}
								variant={isActive ? "default" : "secondary"}
							>
								{option.icon}
								{option.label}
								{option.count !== undefined && ` (${option.count})`}
							</Badge>
						);
					})}
				</div>
			);

		default:
			return null;
	}
}

/**
 * Renders an action button with optional tooltip
 */
function ActionButton({ action }: { action: ActionDef }) {
	const button = (
		<Button
			disabled={action.disabled || action.loading}
			onClick={action.onClick}
			size="sm"
			variant={action.variant || "outline"}
		>
			{action.loading ? (
				<span className="mr-2 size-4 animate-spin">⟳</span>
			) : (
				action.icon && <span className="mr-2">{action.icon}</span>
			)}
			{action.label}
		</Button>
	);

	if (action.tooltip) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>{button}</TooltipTrigger>
				<TooltipContent>{action.tooltip}</TooltipContent>
			</Tooltip>
		);
	}

	return button;
}

/**
 * Toolbar component for DataTable with search, filters, and actions
 */
export function DataTableToolbar({
	searchValue,
	onSearchChange,
	searchPlaceholder = "Search...",
	filters,
	actions,
	children,
	showSearchIcon = true,
}: DataTableToolbarProps) {
	return (
		<div className="mb-6 space-y-4">
			{/* Row 1: Search, Actions, and Filters (inline) */}
			{(onSearchChange ||
				(actions && actions.length > 0) ||
				(filters && filters.length > 0)) && (
				<div className="flex items-center gap-3">
					{onSearchChange && (
						<div className="relative max-w-md flex-1">
							{showSearchIcon && (
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
							)}
							<Input
								className={showSearchIcon ? "pl-9" : undefined}
								onChange={(e) => onSearchChange(e.target.value)}
								placeholder={searchPlaceholder}
								type="search"
								value={searchValue || ""}
							/>
							{searchValue && (
								<button
									aria-label="Clear search"
									className="-translate-y-1/2 absolute top-1/2 right-2 text-gray-400 hover:text-gray-600"
									onClick={() => onSearchChange("")}
									type="button"
								>
									<X className="size-4" />
								</button>
							)}
						</div>
					)}
					{actions && actions.length > 0 && (
						<div className="flex items-center gap-2">
							{actions.map((action) => (
								<ActionButton action={action} key={action.id} />
							))}
						</div>
					)}
					{/* Inline filters beside actions */}
					{filters && filters.length > 0 && (
						<div className="flex items-center gap-2">
							{filters.map((filter) => (
								<FilterRenderer filter={filter} key={filter.id} />
							))}
						</div>
					)}
				</div>
			)}

			{/* Additional content */}
			{children}

			{/* Search results message */}
			{searchValue && (
				<div className="text-muted-foreground text-sm">
					Searching for "{searchValue}"
				</div>
			)}
		</div>
	);
}
