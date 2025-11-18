"use client";

import { useMemo } from "react";
import { useBookingsList } from "@/entities/booking/api/use-bookings-list";
import RouterButton from "@/shared/ui/router-button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/shadcn/table";
import { buildHref } from "../model/list.routes";

export type WidgetPreset =
	| "recent_completed"
	| "pending_review"
	| "in_progress"
	| "custom";

export function DashboardBookingsWidget({
	title,
	preset = "recent_completed",
	limit = 5,
	customFilters,
	showViewAll = true,
}: {
	title?: string;
	preset?: WidgetPreset;
	limit?: number;
	customFilters?: {
		status?: string[];
		type?: "all" | "analysis_only" | "working_space";
	};
	showViewAll?: boolean;
}) {
	const derived = useMemo(() => {
		if (preset === "custom") {
			return {
				status: customFilters?.status,
				sort: "updated_at:desc" as const,
			};
		}
		if (preset === "pending_review") {
			return {
				status: ["pending_user_verification", "pending_approval"],
				sort: "created_at:asc" as const,
			};
		}
		if (preset === "in_progress") {
			return { status: ["in_progress"], sort: "updated_at:desc" as const };
		}
		// recent_completed default
		return { status: ["completed"], sort: "updated_at:desc" as const };
	}, [preset, customFilters]);

	const { data, isLoading } = useBookingsList({
		page: 1,
		pageSize: limit,
		sort: derived.sort,
		status: derived.status ?? [],
	});

	const items = data?.items ?? [];

	const baseParams = {
		page: 1,
		pageSize: 25,
		sort: derived.sort,
		q: "",
		type: customFilters?.type ?? "all",
	} as const;
	type FiltersState = Parameters<typeof buildHref>[1];
	let viewAllParams: FiltersState = {
		...baseParams,
	} as unknown as FiltersState;
	if (derived.status) {
		viewAllParams = {
			...(viewAllParams as object),
			status: derived.status,
		} as FiltersState;
	}
	const href = buildHref("/bookings", viewAllParams);

	return (
		<div className="rounded-md border p-4">
			<div className="mb-3 flex items-center justify-between">
				<h3 className="font-semibold">{title ?? "Bookings"}</h3>
				{showViewAll && (
					<RouterButton href={href} size="sm" variant="outline">
						View all
					</RouterButton>
				)}
			</div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Reference</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Created</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{items.map((i) => (
						<TableRow key={i.id}>
							<TableCell>{i.reference}</TableCell>
							<TableCell>{i.status}</TableCell>
							<TableCell>
								{new Date(i.createdAt).toLocaleDateString(undefined, {
									year: "numeric",
									month: "short",
									day: "2-digit",
								})}
							</TableCell>
						</TableRow>
					))}
					{!isLoading && items.length === 0 && (
						<TableRow>
							<TableCell className="py-6 text-center text-gray-500" colSpan={3}>
								No items
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
