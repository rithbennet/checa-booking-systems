"use client";

import { AlertCircle, Banknote, Clock, Loader2, Receipt } from "lucide-react";
import { useMemo, useState } from "react";
import { useUserFinancials } from "@/entities/booking";
import type { UserPaymentStatus } from "@/entities/booking/server/user-financials-repository";
import {
	formatAmount,
	getFinancialsColumns,
} from "@/features/finance/user-financials";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import {
	DataTable,
	DataTableStatusChips,
	DataTableToolbar,
	type FilterDef,
	STATUS_CHIP_COLORS,
	type StatusChipOption,
} from "@/shared/ui/table";

export default function FinancialsPage() {
	const { data, isLoading, error } = useUserFinancials();

	// Filter states
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<
		UserPaymentStatus | undefined
	>(undefined);
	const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

	const columns = useMemo(() => getFinancialsColumns(), []);

	// Calculate counts for status chips
	const statusCounts = useMemo(() => {
		if (!data?.items)
			return {
				all: 0,
				unpaid: 0,
				pending_verification: 0,
				verified: 0,
				rejected: 0,
			};
		return {
			all: data.items.length,
			unpaid: data.items.filter((i) => i.paymentStatus === "unpaid").length,
			pending_verification: data.items.filter(
				(i) => i.paymentStatus === "pending_verification",
			).length,
			verified: data.items.filter((i) => i.paymentStatus === "verified").length,
			rejected: data.items.filter((i) => i.paymentStatus === "rejected").length,
		};
	}, [data?.items]);

	// Status chip options
	const statusChipOptions: StatusChipOption<UserPaymentStatus | undefined>[] = [
		{
			value: undefined,
			label: "All",
			count: statusCounts.all,
			activeClassName: STATUS_CHIP_COLORS.all,
		},
		{
			value: "unpaid",
			label: "Unpaid",
			count: statusCounts.unpaid,
			activeClassName: STATUS_CHIP_COLORS.rejected,
		},
		{
			value: "pending_verification",
			label: "Pending",
			count: statusCounts.pending_verification,
			activeClassName: STATUS_CHIP_COLORS.pending,
		},
		{
			value: "verified",
			label: "Paid",
			count: statusCounts.verified,
			activeClassName: STATUS_CHIP_COLORS.active,
		},
		{
			value: "rejected",
			label: "Rejected",
			count: statusCounts.rejected,
			activeClassName: STATUS_CHIP_COLORS.error,
		},
	];

	// Sort filter options
	const sortFilters: FilterDef[] = [
		{
			id: "sort",
			label: "Sort",
			type: "select",
			options: [
				{ value: "newest", label: "Newest first" },
				{ value: "oldest", label: "Oldest first" },
			],
			value: sortOrder,
			onChange: (value) =>
				setSortOrder((value as "newest" | "oldest") ?? "newest"),
			className: "w-[150px]",
		},
	];

	// Filter and sort data client-side
	const filteredItems = useMemo(() => {
		if (!data?.items) return [];
		let filtered = [...data.items];

		// Apply status filter
		if (statusFilter) {
			filtered = filtered.filter((item) => item.paymentStatus === statusFilter);
		}

		// Apply search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(item) =>
					item.invoiceNumber.toLowerCase().includes(query) ||
					item.bookingRef.toLowerCase().includes(query),
			);
		}

		// Apply sort
		filtered.sort((a, b) => {
			const dateA = new Date(a.createdAt).getTime();
			const dateB = new Date(b.createdAt).getTime();
			return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
		});

		return filtered;
	}, [data?.items, statusFilter, searchQuery, sortOrder]);

	if (isLoading) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="flex min-h-[400px] flex-col items-center justify-center gap-2 text-muted-foreground">
				<AlertCircle className="size-8" />
				<p>Failed to load financial data. Please try again.</p>
			</div>
		);
	}

	const { summary } = data;

	return (
		<div className="space-y-6 p-6">
			{/* Page Header */}
			<div>
				<h1 className="font-bold text-2xl text-slate-900">Financials</h1>
				<p className="text-muted-foreground text-sm">
					View your invoices and manage payments
				</p>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Total Outstanding
						</CardTitle>
						<Banknote className="size-4 text-red-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-red-600">
							{formatAmount(summary.totalOutstanding)}
						</div>
						<p className="text-muted-foreground text-xs">
							Unpaid or rejected payments
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Pending Verification
						</CardTitle>
						<Clock className="size-4 text-yellow-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-yellow-600">
							{formatAmount(summary.totalPending)}
						</div>
						<p className="text-muted-foreground text-xs">
							Awaiting admin verification
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Total Paid</CardTitle>
						<Receipt className="size-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-green-600">
							{formatAmount(summary.totalPaid)}
						</div>
						<p className="text-muted-foreground text-xs">
							Successfully verified payments
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Invoices Table */}
			<div className="space-y-4">
				<h2 className="font-semibold text-lg">Your Invoices</h2>

				{/* Toolbar with search and filters */}
				<DataTableToolbar
					filters={sortFilters}
					onSearchChange={setSearchQuery}
					searchPlaceholder="Search by invoice or booking ref..."
					searchValue={searchQuery}
				>
					<DataTableStatusChips
						active={statusFilter}
						label="Status:"
						onChange={setStatusFilter}
						options={statusChipOptions}
					/>
				</DataTableToolbar>

				<DataTable
					columns={columns}
					data={filteredItems}
					emptyMessage="No invoices found"
					emptyState={
						searchQuery || statusFilter ? (
							<div className="flex flex-col items-center gap-2 py-8 text-center">
								<Receipt className="size-12 text-muted-foreground/50" />
								<p className="text-muted-foreground">
									No invoices match your filters.
								</p>
								<p className="text-muted-foreground text-sm">
									Try adjusting your search or filter criteria.
								</p>
							</div>
						) : (
							<div className="flex flex-col items-center gap-2 py-8 text-center">
								<Receipt className="size-12 text-muted-foreground/50" />
								<p className="text-muted-foreground">
									You don't have any invoices yet.
								</p>
								<p className="text-muted-foreground text-sm">
									Invoices will appear here once your bookings are processed.
								</p>
							</div>
						)
					}
					getRowId={(row) => row.id}
					isLoading={false}
				/>
			</div>
		</div>
	);
}
