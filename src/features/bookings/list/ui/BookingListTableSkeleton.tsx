import { Skeleton } from "@/shared/ui/shadcn/skeleton";
import { TableCell, TableRow } from "@/shared/ui/shadcn/table";

const ROW_PLACEHOLDERS = Array.from({ length: 6 }, (_, index) => index);

export function BookingListTableSkeleton() {
	return (
		<>
			{ROW_PLACEHOLDERS.map((row) => (
				<TableRow key={`booking-skeleton-row-${row}`}>
					<TableCell>
						<div className="flex items-center gap-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-4 rounded-full" />
						</div>
					</TableCell>
					<TableCell>
						<Skeleton className="h-4 w-48" />
					</TableCell>
					<TableCell>
						<Skeleton className="h-5 w-24 rounded-full" />
					</TableCell>
					<TableCell className="text-right">
						<div className="flex justify-end">
							<Skeleton className="h-4 w-16" />
						</div>
					</TableCell>
					<TableCell>
						<Skeleton className="h-4 w-32" />
					</TableCell>
					<TableCell>
						<div className="flex justify-end gap-2">
							<Skeleton className="h-9 w-9 rounded-md" />
							<Skeleton className="h-9 w-9 rounded-md" />
							<Skeleton className="h-9 w-9 rounded-md" />
						</div>
					</TableCell>
				</TableRow>
			))}
		</>
	);
}
