/**
 * BookingDocumentsList Component
 *
 * Displays a list of uploaded booking documents with download links.
 */

"use client";

import { format } from "date-fns";
import { Download, FileText, Image, Loader2 } from "lucide-react";
import type {
    BookingDocumentVM,
    DocumentType,
} from "@/entities/booking-document";
import {
    formatFileSize,
    getDocumentTypeLabel,
    useBookingDocuments,
} from "@/entities/booking-document";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";

interface BookingDocumentsListProps {
    bookingId: string;
    className?: string;
    /** Filter to show only specific document types */
    filterTypes?: DocumentType[];
    /** Show empty state when no documents */
    showEmptyState?: boolean;
    /** Whether to show the uploader info (for admin view) */
    showUploader?: boolean;
}

function getFileIcon(mimeType: string) {
    if (mimeType.startsWith("image/")) {
        return <Image className="h-4 w-4 text-blue-500" />;
    }
    return <FileText className="h-4 w-4 text-red-500" />;
}

function getStatusBadge(status: string | null) {
    if (!status) return null;

    const statusConfig: Record<string, { label: string; className: string }> = {
        sent: {
            label: "Sent",
            className: "bg-blue-50 text-blue-700 border-blue-200",
        },
        uploaded: {
            label: "Uploaded",
            className: "bg-green-50 text-green-700 border-green-200",
        },
        verified: {
            label: "Verified",
            className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        },
        pending: {
            label: "Pending",
            className: "bg-yellow-50 text-yellow-700 border-yellow-200",
        },
    };

    const config = statusConfig[status] ?? {
        label: status,
        className: "bg-slate-50 text-slate-700 border-slate-200",
    };

    return (
        <Badge className={cn("text-[10px]", config.className)} variant="outline">
            {config.label}
        </Badge>
    );
}

function DocumentRow({
    document,
    showUploader,
}: {
    document: BookingDocumentVM;
    showUploader?: boolean;
}) {
    const handleDownload = () => {
        // Open download URL in new tab
        window.open(`/api/booking-docs/${document.id}/download`, "_blank");
    };

    return (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-3">
                {getFileIcon(document.blob.mimeType)}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-slate-900 text-sm">
                            {document.blob.fileName}
                        </p>
                        {getStatusBadge(document.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-slate-500 text-xs">
                        <span>{getDocumentTypeLabel(document.type)}</span>
                        <span>•</span>
                        <span>{formatFileSize(document.blob.sizeBytes)}</span>
                        <span>•</span>
                        <span>{format(new Date(document.createdAt), "MMM d, yyyy")}</span>
                        {showUploader && (
                            <>
                                <span>•</span>
                                <span>
                                    by {document.createdBy.firstName}{" "}
                                    {document.createdBy.lastName}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <Button onClick={handleDownload} size="sm" variant="ghost">
                <Download className="h-4 w-4" />
            </Button>
        </div>
    );
}

export function BookingDocumentsList({
    bookingId,
    className,
    filterTypes,
    showEmptyState = true,
    showUploader = false,
}: BookingDocumentsListProps) {
    const { data: documents, isLoading, error } = useBookingDocuments(bookingId);

    if (isLoading) {
        return (
            <div className={cn("flex items-center justify-center py-6", className)}>
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className={cn("py-4 text-center text-red-500 text-sm", className)}>
                Failed to load documents
            </div>
        );
    }

    // Filter documents if filterTypes is provided
    const filteredDocs = filterTypes
        ? documents?.filter((doc) => filterTypes.includes(doc.type))
        : documents;

    if (!filteredDocs || filteredDocs.length === 0) {
        if (!showEmptyState) return null;

        return (
            <div
                className={cn(
                    "rounded-lg border border-slate-200 border-dashed bg-slate-50 p-6 text-center",
                    className,
                )}
            >
                <FileText className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 font-medium text-slate-500 text-sm">
                    No documents uploaded yet
                </p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-2", className)}>
            {filteredDocs.map((doc) => (
                <DocumentRow document={doc} key={doc.id} showUploader={showUploader} />
            ))}
        </div>
    );
}
