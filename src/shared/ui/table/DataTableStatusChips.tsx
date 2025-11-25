"use client";

import { Badge } from "@/shared/ui/shadcn/badge";

/**
 * Configuration for a single status chip option
 */
export interface StatusChipOption<T extends string | undefined = string> {
	/** The value to filter by (undefined represents "all") */
	value: T;
	/** Display label for the chip */
	label: string;
	/** Count to display next to the label */
	count?: number;
	/** Active state class names (bg, text, ring colors) */
	activeClassName?: string;
}

/**
 * Props for the DataTableStatusChips component
 */
export interface DataTableStatusChipsProps<
	T extends string | undefined = string,
> {
	/** Array of status options to display */
	options: StatusChipOption<T>[];
	/** Currently active status value */
	active: T;
	/** Callback when a status is selected */
	onChange: (status: T) => void;
	/** Optional label to show before the chips */
	label?: string;
	/** Default inactive chip class */
	inactiveClassName?: string;
}

/**
 * Default styling for inactive chips
 */
const DEFAULT_INACTIVE_CLASS =
	"bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300";

/**
 * Default styling for active chips (when no custom activeClassName provided)
 */
const DEFAULT_ACTIVE_CLASS =
	"bg-slate-100 text-slate-800 ring-2 ring-slate-500";

/**
 * A reusable status chips component for filtering data tables.
 * Supports single-value selection with customizable styling per status.
 *
 * @example
 * ```tsx
 * const statusOptions = [
 *   { value: undefined, label: "All", count: 100, activeClassName: "bg-slate-100 text-slate-800 ring-2 ring-slate-500" },
 *   { value: "pending", label: "Pending", count: 25, activeClassName: "bg-yellow-100 text-yellow-800 ring-2 ring-yellow-500" },
 *   { value: "active", label: "Active", count: 50, activeClassName: "bg-green-100 text-green-800 ring-2 ring-green-500" },
 * ];
 *
 * <DataTableStatusChips
 *   options={statusOptions}
 *   active={currentStatus}
 *   onChange={setCurrentStatus}
 *   label="Status:"
 * />
 * ```
 */
export function DataTableStatusChips<T extends string | undefined = string>({
	options,
	active,
	onChange,
	label,
	inactiveClassName = DEFAULT_INACTIVE_CLASS,
}: DataTableStatusChipsProps<T>) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			{label && (
				<span className="font-medium text-muted-foreground text-sm">
					{label}
				</span>
			)}
			{options.map((option) => {
				const isActive = active === option.value;
				const activeClass = option.activeClassName ?? DEFAULT_ACTIVE_CLASS;

				return (
					<Badge
						className={`cursor-pointer rounded-full transition-all ${
							isActive ? activeClass : inactiveClassName
						}`}
						key={option.value ?? "__all__"}
						onClick={() => onChange(option.value)}
						variant="secondary"
					>
						{option.label}
						{option.count !== undefined && ` (${option.count})`}
					</Badge>
				);
			})}
		</div>
	);
}

/**
 * Pre-defined status color configurations for common use cases
 */
export const STATUS_CHIP_COLORS = {
	// Generic states
	all: "bg-slate-100 text-slate-800 ring-2 ring-slate-500",
	default: "bg-slate-100 text-slate-800 ring-2 ring-slate-500",

	// Positive states
	active: "bg-green-100 text-green-800 ring-2 ring-green-500",
	approved: "bg-green-100 text-green-800 ring-2 ring-green-500",
	completed: "bg-green-100 text-green-800 ring-2 ring-green-500",
	success: "bg-green-100 text-green-800 ring-2 ring-green-500",

	// Warning states
	pending: "bg-yellow-100 text-yellow-800 ring-2 ring-yellow-500",
	pending_approval: "bg-yellow-100 text-yellow-800 ring-2 ring-yellow-500",
	warning: "bg-yellow-100 text-yellow-800 ring-2 ring-yellow-500",
	revision_requested: "bg-amber-100 text-amber-800 ring-2 ring-amber-500",

	// Neutral states
	inactive: "bg-gray-100 text-gray-800 ring-2 ring-gray-500",
	draft: "bg-gray-100 text-gray-800 ring-2 ring-gray-500",

	// Negative states
	rejected: "bg-red-100 text-red-800 ring-2 ring-red-500",
	error: "bg-red-100 text-red-800 ring-2 ring-red-500",
	cancelled: "bg-red-100 text-red-800 ring-2 ring-red-500",

	// Special states
	suspended: "bg-orange-100 text-orange-800 ring-2 ring-orange-500",
	in_progress: "bg-blue-100 text-blue-800 ring-2 ring-blue-500",
	processing: "bg-blue-100 text-blue-800 ring-2 ring-blue-500",
} as const;

/**
 * Helper function to get status chip color class by status key
 */
export function getStatusChipColor(
	status: keyof typeof STATUS_CHIP_COLORS | string,
): string {
	return (
		STATUS_CHIP_COLORS[status as keyof typeof STATUS_CHIP_COLORS] ??
		STATUS_CHIP_COLORS.default
	);
}

/**
 * Helper to create status chip options from a counts object
 *
 * @example
 * ```tsx
 * const counts = { all: 100, pending: 25, active: 50, rejected: 10 };
 * const options = createStatusChipOptions(counts, {
 *   all: "All",
 *   pending: "Pending",
 *   active: "Active",
 *   rejected: "Rejected",
 * });
 * ```
 */
export function createStatusChipOptions<T extends string>(
	counts: Record<string, number> | undefined,
	labels: Record<T | "all", string>,
	statusOrder?: (T | "all")[],
): StatusChipOption<T | undefined>[] {
	const orderedStatuses = statusOrder ?? (Object.keys(labels) as (T | "all")[]);

	return orderedStatuses.map((status) => ({
		value: status === "all" ? undefined : (status as T),
		label: labels[status as T | "all"],
		count: counts?.[status],
		activeClassName: getStatusChipColor(status),
	}));
}
