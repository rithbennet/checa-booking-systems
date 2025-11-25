import type { ReactNode } from "react";

/**
 * Column definition for the DataTable component.
 * Generic type T represents the row data type.
 */
export interface ColumnDef<T> {
	/** Unique identifier for the column */
	id: string;
	/** Column header text or component */
	header: ReactNode | ((props: { column: ColumnDef<T> }) => ReactNode);
	/** Cell renderer - receives the row data and renders cell content */
	cell: (props: { row: T; rowIndex: number }) => ReactNode;
	/** Column width (Tailwind class) */
	className?: string;
	/** Whether to show tooltip on header */
	headerTooltip?: string;
	/** Text alignment */
	align?: "left" | "center" | "right";
	/** Whether the column is sortable */
	sortable?: boolean;
	/** Sort key for this column (if different from id) */
	sortKey?: string;
}

/**
 * Selection state for the table
 */
export interface SelectionState {
	/** Set of selected row IDs */
	selectedIds: Set<string>;
	/** Handler for selecting/deselecting all rows */
	onSelectAll: (checked: boolean, selectableIds: string[]) => void;
	/** Handler for selecting/deselecting a single row */
	onSelectRow: (id: string, checked: boolean) => void;
	/** Function to determine if a row is selectable */
	isRowSelectable?: (row: unknown) => boolean;
}

/**
 * Pagination state for the table
 */
export interface PaginationState {
	/** Current page number (1-indexed) */
	currentPage: number;
	/** Number of items per page */
	pageSize: number;
	/** Total number of items */
	total: number;
	/** Handler for page changes */
	onPageChange: (page: number) => void;
	/** Handler for page size changes */
	onPageSizeChange: (pageSize: number) => void;
	/** Available page size options */
	pageSizeOptions?: number[];
}

/**
 * Sort state for the table
 */
export interface SortState {
	/** Current sort column ID */
	sortKey: string;
	/** Sort direction */
	sortDirection: "asc" | "desc";
	/** Handler for sort changes */
	onSortChange: (key: string, direction: "asc" | "desc") => void;
}

/**
 * Filter definition for toolbar filters
 */
export interface FilterDef {
	/** Unique identifier for the filter */
	id: string;
	/** Filter label */
	label: string;
	/** Filter type */
	type: "select" | "multi-select" | "chips" | "date-range";
	/** Filter options (for select/multi-select/chips) */
	options?: Array<{
		value: string;
		label: string;
		count?: number;
		icon?: ReactNode;
	}>;
	/** Current filter value */
	value: string | string[] | undefined;
	/** Handler for filter changes */
	onChange: (value: string | string[] | undefined) => void;
	/** Placeholder text */
	placeholder?: string;
	/** Width class for the filter */
	className?: string;
}

/**
 * Action button definition for toolbar
 */
export interface ActionDef {
	/** Unique identifier */
	id: string;
	/** Button label */
	label: string;
	/** Icon component */
	icon?: ReactNode;
	/** Button variant */
	variant?:
		| "default"
		| "destructive"
		| "outline"
		| "secondary"
		| "ghost"
		| "link";
	/** Click handler */
	onClick: () => void;
	/** Whether the action is disabled */
	disabled?: boolean;
	/** Whether the action is loading */
	loading?: boolean;
	/** Tooltip text */
	tooltip?: string;
}

/**
 * Bulk action definition
 */
export interface BulkActionDef {
	/** Unique identifier */
	id: string;
	/** Button label */
	label: string;
	/** Icon component */
	icon?: ReactNode;
	/** Button variant */
	variant?:
		| "default"
		| "destructive"
		| "outline"
		| "secondary"
		| "ghost"
		| "link";
	/** Click handler - receives selected IDs */
	onClick: (selectedIds: string[]) => void;
	/** Whether the action is disabled */
	disabled?: boolean;
	/** Whether the action is loading */
	loading?: boolean;
}

/**
 * Props for the DataTable component
 */
export interface DataTableProps<T> {
	/** Column definitions */
	columns: ColumnDef<T>[];
	/** Row data */
	data: T[];
	/** Function to get unique ID from row */
	getRowId: (row: T) => string;
	/** Whether data is loading */
	isLoading?: boolean;
	/** Selection state (optional - enables row selection) */
	selection?: SelectionState;
	/** Empty state message */
	emptyMessage?: string;
	/** Empty state component */
	emptyState?: ReactNode;
	/** Number of skeleton rows to show when loading */
	skeletonRowCount?: number;
	/** Row click handler */
	onRowClick?: (row: T) => void;
	/** Row class name function */
	getRowClassName?: (row: T) => string;
}

/**
 * Props for the DataTableToolbar component
 */
export interface DataTableToolbarProps {
	/** Search input value */
	searchValue?: string;
	/** Search input change handler */
	onSearchChange?: (value: string) => void;
	/** Search placeholder */
	searchPlaceholder?: string;
	/** Filter definitions */
	filters?: FilterDef[];
	/** Action buttons */
	actions?: ActionDef[];
	/** Additional content to render in the toolbar */
	children?: ReactNode;
	/** Whether to show search icon */
	showSearchIcon?: boolean;
	/** Sort field value (e.g., "created", "name") */
	sortValue?: string;
	/** Sort direction: "asc" or "desc" */
	sortDirection?: "asc" | "desc";
	/** Handler for sort field changes */
	onSortChange?: (value: string) => void;
	/** Handler for sort direction changes */
	onSortDirectionChange?: (direction: "asc" | "desc") => void;
}

/**
 * Props for the DataTableBulkActions component
 */
export interface DataTableBulkActionsProps {
	/** Number of selected items */
	selectedCount: number;
	/** Bulk action definitions */
	actions: BulkActionDef[];
	/** Clear selection handler */
	onClearSelection: () => void;
	/** Selected IDs for passing to action handlers */
	selectedIds: string[];
}

/**
 * Props for the DataTablePagination component
 */
export interface DataTablePaginationProps extends PaginationState {
	/** Number of rows currently displayed */
	rowsCount: number;
	/** Whether data is loading */
	isLoading?: boolean;
}
