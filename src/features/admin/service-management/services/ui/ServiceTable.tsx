/**
 * Service Table
 *
 * Admin table for managing services with filters and actions
 */

"use client";

import {
    Edit,
    MoreHorizontal,
    Plus,
    Power,
    PowerOff,
    Search,
} from "lucide-react";
import { type JSX, useCallback, useMemo, useState } from "react";
import type {
    AdminServiceFilters,
    AdminServiceListItem,
} from "@/entities/service";
import { useAdminServices, useToggleServiceActive } from "@/entities/service";
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
import {
    type ColumnDef,
    DataTable,
    DataTablePagination,
} from "@/shared/ui/table";
import { serviceCategoryLabels } from "../model/form-schema";

interface ServiceTableProps {
    onCreate: () => void;
    onEdit: (serviceId: string) => void;
}

// Status badge styling
function getStatusBadgeClass(isActive: boolean): string {
    return isActive
        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
}

// Category badge styling
function getCategoryBadgeClass(category: string): string {
    const colors: Record<string, string> = {
        ftir_atr:
            "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        ftir_kbr:
            "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
        uv_vis_absorbance:
            "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        uv_vis_reflectance:
            "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
        bet_analysis:
            "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
        hplc_pda:
            "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
        working_space:
            "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
}

// Format price range
function formatPriceRange(
    minPrice: number | null,
    maxPrice: number | null,
): string {
    if (minPrice === null && maxPrice === null) {
        return "Not set";
    }
    if (minPrice === maxPrice) {
        return `RM ${minPrice?.toFixed(2)}`;
    }
    return `RM ${minPrice?.toFixed(2)} - ${maxPrice?.toFixed(2)}`;
}

// Format date
function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-MY", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function ServiceTable({
    onCreate,
    onEdit,
}: ServiceTableProps): JSX.Element {
    // Filter state
    const [search, setSearch] = useState("");
    const [category, setCategory] =
        useState<AdminServiceFilters["category"]>("all");
    const [status, setStatus] = useState<AdminServiceFilters["status"]>("all");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Fetch services
    const { data, isLoading, error } = useAdminServices({
        search: search || undefined,
        category: category === "all" ? undefined : category,
        status,
        page,
        perPage: pageSize,
    });

    // Toggle mutation
    const toggleMutation = useToggleServiceActive();

    // Handle toggle active
    const handleToggleActive = useCallback(
        (id: string, currentStatus: boolean) => {
            toggleMutation.mutate({ id, isActive: !currentStatus });
        },
        [toggleMutation],
    );

    // Selection handlers
    const handleSelectAll = (checked: boolean, selectableIds: string[]) => {
        if (checked) {
            setSelectedIds(new Set(selectableIds));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        const newSet = new Set(selectedIds);
        if (checked) {
            newSet.add(id);
        } else {
            newSet.delete(id);
        }
        setSelectedIds(newSet);
    };

    // Define columns
    const columns: ColumnDef<AdminServiceListItem>[] = useMemo(
        () => [
            {
                id: "code",
                header: "Code",
                className: "w-[100px]",
                cell: ({ row }) => (
                    <span className="font-medium font-mono text-sm">{row.code}</span>
                ),
            },
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
                id: "category",
                header: "Category",
                className: "w-[150px]",
                cell: ({ row }) => (
                    <Badge
                        className={getCategoryBadgeClass(row.category)}
                        variant="outline"
                    >
                        {serviceCategoryLabels[row.category] || row.category}
                    </Badge>
                ),
            },
            {
                id: "requiresSample",
                header: "Sample",
                className: "w-[80px]",
                cell: ({ row }) => (
                    <span className="text-sm">{row.requiresSample ? "Yes" : "No"}</span>
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
                id: "price",
                header: "Price Range",
                className: "w-[150px]",
                cell: ({ row }) => (
                    <span className="text-sm">
                        {formatPriceRange(row.minPrice, row.maxPrice)}
                    </span>
                ),
            },
            {
                id: "updatedAt",
                header: "Updated",
                className: "w-[120px]",
                cell: ({ row }) => (
                    <span className="text-muted-foreground text-sm">
                        {formatDate(row.updatedAt)}
                    </span>
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
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        [onEdit, handleToggleActive, toggleMutation.isPending],
    ) as ColumnDef<AdminServiceListItem>[];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
                <div className="relative min-w-[200px] max-w-sm flex-1">
                    <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search services..."
                        value={search}
                    />
                </div>

                {/* Category filter */}
                <Select
                    onValueChange={(value) => {
                        setCategory(value as AdminServiceFilters["category"]);
                        setPage(1);
                    }}
                    value={category ?? "all"}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {Object.entries(serviceCategoryLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Status filter */}
                <Select
                    onValueChange={(value) => {
                        setStatus(value as AdminServiceFilters["status"]);
                        setPage(1);
                    }}
                    value={status ?? "all"}
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
                    Add Service
                </Button>
            </div>

            {error ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                    Failed to load services. Please try again.
                </div>
            ) : null}

            {/* Table */}
            <DataTable
                columns={columns}
                data={data?.items || []}
                emptyMessage="No services found"
                getRowId={(row) => row.id}
                isLoading={isLoading}
                selection={{
                    selectedIds,
                    onSelectAll: handleSelectAll,
                    onSelectRow: handleSelectRow,
                }}
            />

            {data && data.total > 0 ? (
                <DataTablePagination
                    currentPage={page}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setPage(1);
                    }}
                    pageSize={pageSize}
                    rowsCount={data.items.length}
                    total={data.total}
                />
            ) : null}
        </div>
    );
}
