/**
 * BookingDocumentsList Component
 *
 * Displays a list of uploaded booking documents with download links and optional delete.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, FileText, Image, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	type BookingDocumentVM,
	bookingDocumentKeys,
	type DocumentType,
	formatFileSize,
	getDocumentTypeLabel,
	getVerifiableDocumentTypes,
	useBookingDocuments,
} from "@/entities/booking-document";
import { cn } from "@/shared/lib/utils";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/shared/ui/shadcn/alert-dialog";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";

interface BookingDocumentsListProps {
	bookingId: string;
	className?: string;
	/** Filter to show only specific document types */
	filterTypes?: DocumentType[];
	/** Filter to exclude specific document types */
	excludeTypes?: DocumentType[];
	/** Show empty state when no documents */
	showEmptyState?: boolean;
	/** Whether to show the uploader info (for admin view) */
	showUploader?: boolean;
	/** Whether to show delete buttons */
	showDelete?: boolean;
}

function getFileIcon(mimeType: string) {
	if (mimeType.startsWith("image/")) {
		return <Image className="h-4 w-4 text-blue-500" />;
	}
	return <FileText className="h-4 w-4 text-red-500" />;
}

function getStatusBadge(status: string | null | undefined) {
	if (!status) return null;

	const statusConfig: Record<string, { label: string; className: string }> = {
		pending_upload: {
			label: "Pending Upload",
			className: "bg-slate-50 text-slate-700 border-slate-200",
		},
		pending_verification: {
			label: "Pending Review",
			className: "bg-yellow-50 text-yellow-700 border-yellow-200",
		},
		verified: {
			label: "Verified",
			className: "bg-emerald-50 text-emerald-700 border-emerald-200",
		},
		rejected: {
			label: "Rejected",
			className: "bg-red-50 text-red-700 border-red-200",
		},
		not_required: {
			label: "Not Required",
			className: "bg-slate-50 text-slate-500 border-slate-200",
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
	showDelete,
	onDelete,
	isDeleting,
}: {
	document: BookingDocumentVM;
	showUploader?: boolean;
	showDelete?: boolean;
	onDelete?: (id: string) => void;
	isDeleting?: boolean;
}) {
	const handleDownload = () => {
		// Open download URL in new tab
		window.open(`/api/booking-docs/${document.id}/download`, "_blank");
	};

	// Only show verification status for verifiable document types (user uploads)
	const verifiableTypes = getVerifiableDocumentTypes();
	const showVerificationStatus = verifiableTypes.includes(document.type);

	return (
		<div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
			<div className="flex items-center gap-3">
				{getFileIcon(document.blob.mimeType)}
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<p className="truncate font-medium text-slate-900 text-sm">
							{document.blob.fileName}
						</p>
						{showVerificationStatus &&
							getStatusBadge(document.verificationStatus)}
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
			<div className="flex items-center gap-1">
				<Button onClick={handleDownload} size="sm" variant="ghost">
					<Download className="h-4 w-4" />
				</Button>
				{showDelete && onDelete && (
					<Button
						className="text-red-500 hover:bg-red-50 hover:text-red-600"
						disabled={isDeleting}
						onClick={() => onDelete(document.id)}
						size="sm"
						variant="ghost"
					>
						{isDeleting ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Trash2 className="h-4 w-4" />
						)}
					</Button>
				)}
			</div>
		</div>
	);
}

export function BookingDocumentsList({
	bookingId,
	className,
	filterTypes,
	excludeTypes,
	showEmptyState = true,
	showUploader = false,
	showDelete = false,
}: BookingDocumentsListProps) {
	const queryClient = useQueryClient();
	const { data: documents, isLoading, error } = useBookingDocuments(bookingId);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [documentToDelete, setDocumentToDelete] =
		useState<BookingDocumentVM | null>(null);

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: async (documentId: string) => {
			const res = await fetch(`/api/booking-docs/${documentId}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.error || "Failed to delete document");
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: bookingDocumentKeys.byBooking(bookingId),
			});
			toast.success("Document deleted");
			setDeleteDialogOpen(false);
			setDocumentToDelete(null);
		},
		onError: (error) => {
			toast.error("Failed to delete document", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		},
	});

	const handleDeleteClick = (doc: BookingDocumentVM) => {
		setDocumentToDelete(doc);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (documentToDelete) {
			deleteMutation.mutate(documentToDelete.id);
		}
	};

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

	// Filter documents if filterTypes or excludeTypes is provided
	let filteredDocs = documents;
	if (filterTypes) {
		filteredDocs = documents?.filter((doc) => filterTypes.includes(doc.type));
	}

	// apply excludeTypes if passed
	if (typeof excludeTypes !== "undefined" && excludeTypes !== null) {
		filteredDocs = filteredDocs?.filter(
			(doc) => !excludeTypes.includes(doc.type),
		);
	}

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
		<>
			<div className={cn("space-y-2", className)}>
				{filteredDocs.map((doc) => (
					<DocumentRow
						document={doc}
						isDeleting={
							deleteMutation.isPending && documentToDelete?.id === doc.id
						}
						key={doc.id}
						onDelete={() => handleDeleteClick(doc)}
						showDelete={showDelete}
						showUploader={showUploader}
					/>
				))}
			</div>

			{/* Delete Confirmation Dialog */}
			<AlertDialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Document</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete "{documentToDelete?.blob.fileName}
							"? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleteMutation.isPending}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							className="bg-red-600 hover:bg-red-700"
							disabled={deleteMutation.isPending}
							onClick={confirmDelete}
						>
							{deleteMutation.isPending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
