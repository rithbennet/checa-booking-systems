/**
 * BookingDocUploader Component
 *
 * A shared component for uploading booking documents.
 * Supports different document types with role-based access.
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
	bookingDocumentKeys,
	getDocumentTypeLabel,
} from "@/entities/booking-document";
import { useUploadThing } from "@/shared/lib/uploadthing";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/shadcn/button";

/** Types that can be uploaded via UploadThing (excludes server-generated types) */
export type UploadableDocumentType =
	| "service_form_signed"
	| "workspace_form_signed"
	| "payment_receipt"
	| "sample_result";

interface BookingDocUploaderProps {
	bookingId: string;
	type: UploadableDocumentType;
	/** For sample_result uploads, provide the sample tracking ID */
	sampleTrackingId?: string;
	onUploaded?: (documentId: string, blobId: string) => void;
	className?: string;
	label?: string;
	disabled?: boolean;
	/** Whether to show a compact variant */
	compact?: boolean;
	/** Allow multiple file upload (only for sample_result type) */
	allowMultiple?: boolean;
}

export function BookingDocUploader({
	bookingId,
	type,
	sampleTrackingId,
	onUploaded,
	className,
	label,
	disabled,
	compact = false,
	allowMultiple = false,
}: BookingDocUploaderProps) {
	const [isDragOver, setIsDragOver] = useState(false);
	const [uploadComplete, setUploadComplete] = useState(false);
	const queryClient = useQueryClient();

	// Allow multiple files only for sample_result type
	const canUploadMultiple = type === "sample_result" && allowMultiple;

	const { startUpload, isUploading } = useUploadThing("bookingDocs", {
		onClientUploadComplete: (res) => {
			const result = res?.[0]?.serverData;
			if (result) {
				toast.success(`${getDocumentTypeLabel(type)} uploaded successfully`);
				onUploaded?.(result.documentId, result.blobId);
				setUploadComplete(true);
				// Invalidate documents query to refresh the list
				queryClient.invalidateQueries({
					queryKey: bookingDocumentKeys.byBooking(bookingId),
				});
				// Reset success state after 3 seconds
				setTimeout(() => setUploadComplete(false), 3000);
			}
		},
		onUploadError: (err) => {
			toast.error(err?.message ?? "Upload failed. Please try again.");
		},
	});

	const handleFileChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files ? Array.from(e.target.files) : [];
			if (!files.length) return;

			try {
				await startUpload(files, { bookingId, type, sampleTrackingId });
			} catch {
				toast.error("Failed to start upload");
			}

			// Reset the input so the same file can be selected again
			e.target.value = "";
		},
		[bookingId, type, sampleTrackingId, startUpload],
	);

	const handleDrop = useCallback(
		async (e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			setIsDragOver(false);

			const files = Array.from(e.dataTransfer.files);
			if (!files.length) return;

			// Filter to only allowed file types
			const allowedTypes =
				type === "payment_receipt"
					? ["application/pdf", "image/jpeg", "image/png", "image/webp"]
					: type === "sample_result"
						? [
								"application/pdf",
								"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
								"application/vnd.ms-excel",
								"text/csv",
								"text/plain",
							]
						: ["application/pdf"];

			const validFiles = files.filter((file) =>
				allowedTypes.some((t) => {
					const prefix = t.split("/")[0];
					return (prefix && file.type.startsWith(prefix)) || file.type === t;
				}),
			);

			if (validFiles.length === 0) {
				toast.error(
					type === "payment_receipt"
						? "Please upload a PDF or image file"
						: type === "sample_result"
							? "Please upload a PDF, Excel, CSV, or TXT file"
							: "Please upload a PDF file",
				);
				return;
			}

			try {
				// For sample results, allow multiple files if enabled
				const filesToUpload = canUploadMultiple
					? validFiles
					: validFiles.slice(0, 1);
				await startUpload(filesToUpload, {
					bookingId,
					type,
					sampleTrackingId,
				});
			} catch {
				toast.error("Failed to start upload");
			}
		},
		[bookingId, type, sampleTrackingId, startUpload, canUploadMultiple],
	);

	const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragOver(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragOver(false);
	}, []);

	// Determine accepted file types based on document type
	const accept =
		type === "payment_receipt"
			? "application/pdf,image/*"
			: type === "sample_result"
				? "application/pdf,.xlsx,.xls,.csv,.txt,text/plain"
				: "application/pdf";

	const inputId = `file-upload-${type}-${bookingId}`;

	// Compact variant for inline use
	if (compact) {
		return (
			<div className={cn("inline-flex", className)}>
				<input
					accept={accept}
					className="hidden"
					disabled={disabled || isUploading}
					id={inputId}
					multiple={canUploadMultiple}
					onChange={handleFileChange}
					type="file"
				/>
				<label htmlFor={inputId}>
					<Button
						asChild
						disabled={disabled || isUploading}
						size="sm"
						variant={uploadComplete ? "outline" : "default"}
					>
						<span className="cursor-pointer">
							{isUploading ? (
								<>
									<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
									Uploading...
								</>
							) : uploadComplete ? (
								<>
									<CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-green-600" />
									Uploaded
								</>
							) : (
								<>
									<FileUp className="mr-1.5 h-3.5 w-3.5" />
									{label ?? "Upload"}
								</>
							)}
						</span>
					</Button>
				</label>
			</div>
		);
	}

	// Full dropzone variant
	return (
		<div className={cn("space-y-2", className)}>
			<input
				accept={accept}
				className="hidden"
				disabled={disabled || isUploading}
				id={inputId}
				multiple={canUploadMultiple}
				onChange={handleFileChange}
				type="file"
			/>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: drag and drop is optional, file input provides keyboard access */}
			<div
				className={cn(
					"relative rounded-lg border-2 border-dashed p-6 text-center transition-colors",
					isDragOver
						? "border-blue-400 bg-blue-50"
						: uploadComplete
							? "border-green-300 bg-green-50"
							: "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100",
					disabled && "cursor-not-allowed opacity-50",
				)}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
			>
				{isUploading ? (
					<div className="flex flex-col items-center gap-2">
						<Loader2 className="h-8 w-8 animate-spin text-blue-500" />
						<p className="font-medium text-slate-700 text-sm">Uploading...</p>
						<p className="text-slate-500 text-xs">Please wait</p>
					</div>
				) : uploadComplete ? (
					<div className="flex flex-col items-center gap-2">
						<CheckCircle2 className="h-8 w-8 text-green-500" />
						<p className="font-medium text-green-700 text-sm">
							Upload Complete!
						</p>
						<label
							className="cursor-pointer text-green-600 text-xs underline hover:text-green-800"
							htmlFor={inputId}
						>
							Upload another file
						</label>
					</div>
				) : (
					<label className="block cursor-pointer" htmlFor={inputId}>
						<div className="flex flex-col items-center gap-2">
							<FileUp className="h-8 w-8 text-slate-400" />
							<p className="font-medium text-slate-700 text-sm">
								{label ?? `Upload ${getDocumentTypeLabel(type)}`}
							</p>
							<p className="text-slate-500 text-xs">
								{type === "payment_receipt"
									? "PDF or image (max 8MB)"
									: type === "sample_result"
										? "PDF, Excel, CSV, or TXT (max 16MB)"
										: "PDF only (max 16MB)"}
							</p>
							<p className="text-slate-400 text-xs">
								{canUploadMultiple
									? "Drag and drop or click to browse (multiple files allowed)"
									: "Drag and drop or click to browse"}
							</p>
						</div>
					</label>
				)}
			</div>
		</div>
	);
}
