/**
 * Equipment Table
 *
 * Admin table for managing lab equipment with filters and actions
 */

"use client";

import {
    AlertCircle,
    CheckCircle2,
    Edit,
    MoreHorizontal,
    Plus,
    Power,
    PowerOff,
    Search,
    Wrench,
    XCircle,
} from "lucide-react";
import { type JSX, useCallback, useMemo, useState } from "react";
import type {
    AdminEquipmentFilters,
    AdminEquipmentListItem,
} from "@/entities/lab-equipment";

import {
    useAdminEquipment,
    useToggleEquipmentAvailability,
} from "@/entities/lab-equipment";
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
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import {
    type ColumnDef,
    DataTable,
    DataTablePagination,
} from "@/shared/ui/table";

interface EquipmentTableProps {
    onCreate: () => void;
    onEdit: (equipmentId: string) => void;
}

// Availability badge styling
function getAvailabilityBadgeClass(isAvailable: boolean): string {
    return isAvailable
        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
}

// Format date
function formatDate(dateString: string | null): string {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-MY", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function EquipmentTable({
    onCreate,
    onEdit,
}: EquipmentTableProps): JSX.Element {
    // Filter state
    const [search, setSearch] = useState("");
    const [availability, setAvailability] =
        useState<AdminEquipmentFilters["availability"]>("all");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Fetch equipment
    const { data, isLoading, error } = useAdminEquipment({
        search: search || undefined,
        availability,
        page,
        perPage: pageSize,
    });

    // Toggle mutation
    const toggleMutation = useToggleEquipmentAvailability();

    // Handle toggle availability
    const handleToggleAvailability = useCallback(
        (id: string, currentStatus: boolean) => {
            toggleMutation.mutate({ id, isAvailable: !currentStatus });
        },
        [toggleMutation],
    );

    // Define columns
    const columns: ColumnDef<AdminEquipmentListItem>[] = useMemo(
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
                id: "isAvailable",
                header: "Status",
                className: "w-[120px]",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Badge className={getAvailabilityBadgeClass(row.isAvailable)}>
                            {row.isAvailable ? (
                                <>
                                    <CheckCircle2 className="mr-1 size-3" />
                                    Available
                                </>
                            ) : (
                                <>
                                    <XCircle className="mr-1 size-3" />
                                    Unavailable
                                </>
                            )}
                        </Badge>
                    </div>
                ),
            },
            {
                id: "maintenance",
                header: "Maintenance",
                className: "w-[100px]",
                align: "center",
                cell: ({ row }) =>
                    row.hasMaintenanceNotes ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex justify-center">
                                    <Wrench className="size-4 text-amber-500" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>Has maintenance notes</TooltipContent>
                        </Tooltip>
                    ) : (
                        <div className="flex justify-center">
                            <span className="text-muted-foreground">-</span>
                        </div>
                    ),
            },
            {
                id: "expectedMaintenanceEnd",
                header: "Maintenance End",
                className: "w-[150px]",
                cell: ({ row }) => (
                    <span className="text-sm">
                        {formatDate(row.expectedMaintenanceEnd)}
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
                                onClick={() =>
                                    handleToggleAvailability(row.id, row.isAvailable)
                                }
                            >
                                {row.isAvailable ? (
                                    <>
                                        <PowerOff className="mr-2 size-4" />
                                        Mark Unavailable
                                    </>
                                ) : (
                                    <>
                                        <Power className="mr-2 size-4" />
                                        Mark Available
                                    </>
                                )}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        [onEdit, handleToggleAvailability, toggleMutation.isPending],
    ) as ColumnDef<AdminEquipmentListItem>[];

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="relative min-w-[200px] max-w-sm flex-1">
                    <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search equipment..."
                        value={search}
                    />
                </div>

                {/* Availability filter */}
                <Select
                    onValueChange={(value) => {
                        setAvailability(value as AdminEquipmentFilters["availability"]);
                        setPage(1);
                    }}
                    value={availability}
                >
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Availability" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                </Select>

                {/* Create button */}
                <Button className="ml-auto" onClick={onCreate}>
                    <Plus className="mr-2 size-4" />
                    Add Equipment
                </Button>
            </div>

            {error ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="size-4" />
                        Failed to load equipment. Please try again.
                    </div>
                </div>
            ) : null}

            <DataTable
                columns={columns}
                data={data?.items || []}
                emptyMessage="No equipment found"
                getRowId={(row) => row.id}
                isLoading={isLoading}
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
