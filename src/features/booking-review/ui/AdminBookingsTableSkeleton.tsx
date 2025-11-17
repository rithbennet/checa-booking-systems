import { Skeleton } from "@/shared/ui/shadcn/skeleton";
import { TableCell, TableRow } from "@/shared/ui/shadcn/table";

const ROW_PLACEHOLDERS = Array.from({ length: 8 }, (_, index) => index);

export function AdminBookingsTableSkeleton() {
    return (
        <>
            {ROW_PLACEHOLDERS.map((row) => (
                <TableRow key={`admin-booking-skeleton-row-${row}`}>
                    {/* Checkbox */}
                    <TableCell>
                        <Skeleton className="size-4" />
                    </TableCell>
                    {/* Reference */}
                    <TableCell>
                        <Skeleton className="h-4 w-24" />
                    </TableCell>
                    {/* Requester */}
                    <TableCell>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-40" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                    </TableCell>
                    {/* Organization */}
                    <TableCell>
                        <Skeleton className="h-4 w-28" />
                    </TableCell>
                    {/* Project */}
                    <TableCell>
                        <Skeleton className="h-4 w-36" />
                    </TableCell>
                    {/* Status */}
                    <TableCell>
                        <Skeleton className="h-6 w-24 rounded-full" />
                    </TableCell>
                    {/* Amount */}
                    <TableCell className="text-right">
                        <div className="flex justify-end">
                            <Skeleton className="h-4 w-20" />
                        </div>
                    </TableCell>
                    {/* Created */}
                    <TableCell className="text-right">
                        <div className="flex justify-end">
                            <Skeleton className="h-4 w-20" />
                        </div>
                    </TableCell>
                    {/* Updated */}
                    <TableCell className="text-right">
                        <div className="flex justify-end">
                            <Skeleton className="h-4 w-20" />
                        </div>
                    </TableCell>
                    {/* Actions */}
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                            <Skeleton className="size-9 rounded-md" />
                            <Skeleton className="size-9 rounded-md" />
                            <Skeleton className="size-9 rounded-md" />
                            <Skeleton className="size-9 rounded-md" />
                        </div>
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}
