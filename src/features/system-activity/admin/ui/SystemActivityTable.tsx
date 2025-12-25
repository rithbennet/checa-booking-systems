"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AuditLogListItem } from "@/entities/audit-log";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import {
	type ColumnDef,
	DataTable,
	DataTablePagination,
	DataTableToolbar,
} from "@/shared/ui/table";

function formatDate(value: string) {
	const date = new Date(value);
	return date.toLocaleString("en-US", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
		timeZone: "UTC",
	});
}

function MetadataCell({
	metadata,
}: {
	metadata: Record<string, unknown> | null;
}) {
	const [isOpen, setIsOpen] = useState(false);

	if (!metadata) {
		return <span className="text-muted-foreground text-sm">—</span>;
	}

	const asString = JSON.stringify(metadata);
	const isTruncated = asString.length > 80;
	const truncated = isTruncated ? `${asString.slice(0, 80)}...` : asString;

	let prettyJson: string;
	try {
		prettyJson = JSON.stringify(metadata, null, 2);
	} catch {
		prettyJson = asString;
	}

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(prettyJson);
			toast.success("Copied to clipboard");
		} catch (error) {
			console.error("Failed to copy:", error);
			toast.error("Failed to copy to clipboard", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};

	if (!isTruncated) {
		return <span className="text-muted-foreground text-sm">{truncated}</span>;
	}

	return (
		<>
			<button
				aria-label="View full metadata"
				className="flex items-center gap-1 rounded text-muted-foreground text-sm transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
				onClick={() => setIsOpen(true)}
				type="button"
			>
				<span>{truncated}</span>
				<ChevronRight aria-hidden="true" className="h-3 w-3 shrink-0" />
			</button>

			<Dialog onOpenChange={setIsOpen} open={isOpen}>
				<DialogContent className="max-h-[80vh] max-w-2xl">
					<DialogHeader>
						<DialogTitle>Metadata Details</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<pre className="max-h-[60vh] overflow-auto rounded-md bg-muted p-4 text-sm">
							<code>{prettyJson}</code>
						</pre>
						<Button
							className="w-full"
							onClick={handleCopy}
							size="sm"
							variant="outline"
						>
							Copy to Clipboard
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}

const columns: ColumnDef<AuditLogListItem>[] = [
	{
		id: "createdAt",
		header: "Time",
		className: "w-[180px]",
		cell: ({ row }) => formatDate(row.createdAt),
	},
	{
		id: "user",
		header: "Actor",
		className: "w-[220px]",
		cell: ({ row }) => {
			if (row.userName || row.userEmail) {
				return (
					<div className="space-y-1">
						<div className="font-medium text-foreground">
							{row.userName || "Unknown"}
						</div>
						{row.userEmail && (
							<div className="text-muted-foreground text-xs">
								{row.userEmail}
							</div>
						)}
					</div>
				);
			}

			return <span className="text-muted-foreground">System</span>;
		},
	},
	{
		id: "action",
		header: "Action",
		cell: ({ row }) => row.action,
	},
	{
		id: "entity",
		header: "Entity",
		className: "w-[220px]",
		cell: ({ row }) =>
			row.entity ? (
				<div className="space-y-1">
					<div className="font-medium">{row.entity}</div>
					{row.entityId && (
						<div className="text-muted-foreground text-xs">{row.entityId}</div>
					)}
				</div>
			) : (
				<span className="text-muted-foreground">—</span>
			),
	},
	{
		id: "metadata",
		header: "Details",
		className: "max-w-[320px]",
		cell: ({ row }) => <MetadataCell metadata={row.metadata} />,
	},
];

interface SystemActivityTableProps {
	logs: AuditLogListItem[];
	isLoading?: boolean;
	search: string;
	onSearchChange: (value: string) => void;
	page: number;
	pageSize: number;
	total: number;
	onPageChange: (page: number) => void;
	onPageSizeChange: (pageSize: number) => void;
}

export function SystemActivityTable({
	logs,
	isLoading,
	search,
	onSearchChange,
	page,
	pageSize,
	total,
	onPageChange,
	onPageSizeChange,
}: SystemActivityTableProps) {
	return (
		<div className="space-y-4">
			<DataTableToolbar
				onSearchChange={onSearchChange}
				searchPlaceholder="Search actions, users, or entities..."
				searchValue={search}
			/>

			<DataTable
				columns={columns}
				data={logs}
				emptyMessage="No activity found"
				getRowId={(row) => row.id}
				isLoading={isLoading}
			/>

			<DataTablePagination
				currentPage={page}
				isLoading={isLoading}
				onPageChange={onPageChange}
				onPageSizeChange={onPageSizeChange}
				pageSize={pageSize}
				pageSizeOptions={[10, 20, 50, 100]}
				rowsCount={logs.length}
				total={total}
			/>
		</div>
	);
}
