/**
 * Add-On Table
 *
 * Admin table for managing global add-ons
 */

"use client";

import {
	Edit,
	MoreHorizontal,
	Plus,
	Power,
	PowerOff,
	Search,
	Trash2,
} from "lucide-react";
import { type JSX, useCallback, useMemo, useState } from "react";
import {
	type GlobalAddOn,
	useAllGlobalAddOns,
	useDeleteAddOn,
	useToggleAddOnActive,
} from "@/entities/addon";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/shared/ui/shadcn/dropdown-menu";
import { Input } from "@/shared/ui/shadcn/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/shadcn/select";
import { type ColumnDef, DataTable } from "@/shared/ui/table";
import { applicableToLabels } from "../model/form-schema";

interface AddOnTableProps {
	onCreate: () => void;
	onEdit: (addOnId: string) => void;
}

// Status badge styling
function getStatusBadgeClass(isActive: boolean): string {
	return isActive
		? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
		: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
}

export function AddOnTable({ onCreate, onEdit }: AddOnTableProps): JSX.Element {
	// Filter state
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
	const [applicableTo, setApplicableTo] = useState<
		"all" | "sample" | "workspace" | "both"
	>("all");

	// Fetch all add-ons
	const { data: addOns, isLoading, error } = useAllGlobalAddOns();

	// Mutations
	const toggleMutation = useToggleAddOnActive();
	const deleteMutation = useDeleteAddOn();

	// Handle toggle active
	const handleToggleActive = useCallback(
		(id: string, currentStatus: boolean) => {
			toggleMutation.mutate({ id, isActive: !currentStatus });
		},
		[toggleMutation],
	);

	// Handle delete
	const handleDelete = useCallback(
		(id: string) => {
			if (
				confirm(
					"Are you sure you want to delete this add-on? This action cannot be undone.",
				)
			) {
				deleteMutation.mutate(id);
			}
		},
		[deleteMutation],
	);

	// Filter add-ons
	const filteredAddOns = useMemo(() => {
		if (!addOns) return [];

		return addOns.filter((addOn) => {
			// Search filter
			if (search) {
				const searchLower = search.toLowerCase();
				if (
					!addOn.name.toLowerCase().includes(searchLower) &&
					!addOn.description?.toLowerCase().includes(searchLower)
				) {
					return false;
				}
			}

			// Status filter
			if (status === "active" && !addOn.isActive) return false;
			if (status === "inactive" && addOn.isActive) return false;

			// Applicable to filter
			if (applicableTo !== "all" && addOn.applicableTo !== applicableTo) {
				return false;
			}

			return true;
		});
	}, [addOns, search, status, applicableTo]);

	// Define columns
	const columns: ColumnDef<GlobalAddOn>[] = useMemo(
		() => [
			{
				id: "name",
				header: "Name",
				className: "min-w-[200px]",
				cell: ({ row }) => (
					<div>
						<div className="font-medium">{row.name}</div>
						{row.description && (
							<div className="line-clamp-1 text-muted-foreground text-xs">
								{row.description}
							</div>
						)}
					</div>
				),
			},
			{
				id: "applicableTo",
				header: "Applies To",
				className: "w-[150px]",
				cell: ({ row }) => (
					<Badge variant="outline">
						{applicableToLabels[row.applicableTo]}
					</Badge>
				),
			},
			{
				id: "defaultAmount",
				header: "Default Amount",
				className: "w-[140px]",
				cell: ({ row }) => (
					<span className="font-mono text-sm">
						RM {row.defaultAmount.toFixed(2)}
					</span>
				),
			},
			{
				id: "status",
				header: "Status",
				className: "w-[100px]",
				cell: ({ row }) => (
					<Badge className={getStatusBadgeClass(row.isActive)}>
						{row.isActive ? "Active" : "Inactive"}
					</Badge>
				),
			},
			{
				id: "actions",
				header: "Actions",
				className: "w-[80px]",
				align: "right",
				cell: ({ row }) => (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button className="size-8" size="icon" variant="ghost">
								<MoreHorizontal className="size-4" />
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => onEdit(row.id)}>
								<Edit className="mr-2 size-4" />
								Edit
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								disabled={toggleMutation.isPending}
								onClick={() => handleToggleActive(row.id, row.isActive)}
							>
								{row.isActive ? (
									<>
										<PowerOff className="mr-2 size-4" />
										Disable
									</>
								) : (
									<>
										<Power className="mr-2 size-4" />
										Enable
									</>
								)}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="text-destructive"
								disabled={deleteMutation.isPending}
								onClick={() => handleDelete(row.id)}
							>
								<Trash2 className="mr-2 size-4" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				),
			},
		],
		[
			onEdit,
			handleToggleActive,
			handleDelete,
			toggleMutation.isPending,
			deleteMutation.isPending,
		],
	) as ColumnDef<GlobalAddOn>[];

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center gap-4">
				<div className="relative min-w-[200px] max-w-sm flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
					<Input
						className="pl-9"
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search add-ons..."
						value={search}
					/>
				</div>

				{/* Applicable To filter */}
				<Select
					onValueChange={(value) =>
						setApplicableTo(value as typeof applicableTo)
					}
					value={applicableTo}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Applies To" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Types</SelectItem>
						{Object.entries(applicableToLabels).map(([value, label]) => (
							<SelectItem key={value} value={value}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Status filter */}
				<Select
					onValueChange={(value) => setStatus(value as typeof status)}
					value={status}
				>
					<SelectTrigger className="w-[140px]">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Status</SelectItem>
						<SelectItem value="active">Active</SelectItem>
						<SelectItem value="inactive">Inactive</SelectItem>
					</SelectContent>
				</Select>

				{/* Create button */}
				<Button className="ml-auto" onClick={onCreate}>
					<Plus className="mr-2 size-4" />
					Add Add-on
				</Button>
			</div>

			{error ? (
				<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
					Failed to load add-ons. Please try again.
				</div>
			) : null}

			{/* Table */}
			<DataTable
				columns={columns}
				data={filteredAddOns}
				emptyMessage="No add-ons found"
				getRowId={(row) => row.id}
				isLoading={isLoading}
			/>
		</div>
	);
}
