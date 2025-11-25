/**
 * Reusable Data Table Components
 *
 * A collection of components for building data tables with:
 * - Column definitions with custom renderers
 * - Row selection (single and bulk)
 * - Search functionality
 * - Filters (select, chips, multi-select)
 * - Pagination
 * - Loading states (skeletons)
 * - Empty states
 * - Bulk actions
 *
 * @example
 * ```tsx
 * import {
 *   DataTable,
 *   DataTableToolbar,
 *   DataTablePagination,
 *   DataTableBulkActions,
 *   type ColumnDef,
 * } from "@/shared/ui/table";
 *
 * const columns: ColumnDef<User>[] = [
 *   {
 *     id: "name",
 *     header: "Name",
 *     cell: ({ row }) => row.name,
 *   },
 *   {
 *     id: "email",
 *     header: "Email",
 *     cell: ({ row }) => row.email,
 *   },
 *   {
 *     id: "actions",
 *     header: "Actions",
 *     align: "right",
 *     cell: ({ row }) => <ActionButtons user={row} />,
 *   },
 * ];
 *
 * function UsersTable() {
 *   return (
 *     <>
 *       <DataTableToolbar
 *         searchValue={search}
 *         onSearchChange={setSearch}
 *         searchPlaceholder="Search users..."
 *         filters={[
 *           {
 *             id: "status",
 *             label: "Status",
 *             type: "select",
 *             options: statusOptions,
 *             value: statusFilter,
 *             onChange: setStatusFilter,
 *           },
 *         ]}
 *       />
 *       <DataTableBulkActions
 *         selectedCount={selectedIds.size}
 *         selectedIds={Array.from(selectedIds)}
 *         onClearSelection={() => setSelectedIds(new Set())}
 *         actions={[
 *           {
 *             id: "delete",
 *             label: "Delete",
 *             variant: "destructive",
 *             onClick: handleBulkDelete,
 *           },
 *         ]}
 *       />
 *       <DataTable
 *         columns={columns}
 *         data={users}
 *         getRowId={(user) => user.id}
 *         isLoading={isLoading}
 *         selection={{
 *           selectedIds,
 *           onSelectAll: handleSelectAll,
 *           onSelectRow: handleSelectRow,
 *         }}
 *       />
 *       <DataTablePagination
 *         currentPage={page}
 *         pageSize={pageSize}
 *         total={total}
 *         rowsCount={users.length}
 *         onPageChange={setPage}
 *         onPageSizeChange={setPageSize}
 *       />
 *     </>
 *   );
 * }
 * ```
 */

// Components
export { DataTable } from "./DataTable";
export { DataTableBulkActions } from "./DataTableBulkActions";
export { DataTablePagination } from "./DataTablePagination";
export { DataTableSkeleton } from "./DataTableSkeleton";
export type {
	DataTableStatusChipsProps,
	StatusChipOption,
} from "./DataTableStatusChips";
export {
	createStatusChipOptions,
	DataTableStatusChips,
	getStatusChipColor,
	STATUS_CHIP_COLORS,
} from "./DataTableStatusChips";
export { DataTableToolbar } from "./DataTableToolbar";
// Types
export type {
	ActionDef,
	BulkActionDef,
	ColumnDef,
	DataTableBulkActionsProps,
	DataTablePaginationProps,
	DataTableProps,
	DataTableToolbarProps,
	FilterDef,
	PaginationState,
	SelectionState,
	SortState,
} from "./types";
