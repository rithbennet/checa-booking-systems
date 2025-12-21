"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { documentConfigKeys } from "@/entities/document-config/api/query-keys";
import { useUploadThing } from "@/shared/lib/uploadthing";
import { Button } from "@/shared/ui/shadcn/button";

/**
 * Validate image file
 */
function validateImageFile(file: File): { valid: boolean; error?: string } {
	const validTypes = ["image/jpeg", "image/png", "image/webp"];
	if (!validTypes.includes(file.type)) {
		return {
			valid: false,
			error: "Please select a JPEG, PNG, or WebP image",
		};
	}

	const maxSize = 2 * 1024 * 1024; // 2MB
	if (file.size > maxSize) {
		return {
			valid: false,
			error: "Image size must be less than 2MB",
		};
	}

	return { valid: true };
}

interface SignatureUploadProps {
	currentImageUrl: string | null;
	onUploadComplete: (
		blobId: string | null,
		imageUrl: string | null,
	) => Promise<void>;
	label?: string;
}

export function SignatureUpload({
	currentImageUrl,
	onUploadComplete,
	label = "Signature",
}: SignatureUploadProps) {
	const [preview, setPreview] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isRemoving, setIsRemoving] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();

	const { startUpload, isUploading } = useUploadThing("signatureImage", {
		onClientUploadComplete: async (res) => {
			if (!res?.[0]) {
				toast.error("Upload failed");
				return;
			}

			const blobId = res[0].serverData?.blobId;
			const url = res[0].url;

			if (!blobId || !url) {
				toast.error("Upload response missing data");
				return;
			}

			await onUploadComplete(blobId, url);

			// Invalidate document config query
			queryClient.invalidateQueries({
				queryKey: documentConfigKeys.global(),
			});

			toast.success(`${label} uploaded successfully`);
			// Revoke blob URL to prevent memory leak
			if (preview?.startsWith("blob:")) {
				URL.revokeObjectURL(preview);
			}
			setPreview(null);
			setSelectedFile(null);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		},
		onUploadError: (error) => {
			toast.error(error.message || "Failed to upload image");
		},
	});

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const validation = validateImageFile(file);
		if (!validation.valid) {
			toast.error(validation.error || "Invalid image file");
			return;
		}

		let previewUrl: string | null = null;
		try {
			previewUrl = URL.createObjectURL(file);
			setPreview(previewUrl);
			setSelectedFile(file);
		} catch (error) {
			// Clean up blob URL on error to prevent memory leak
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
			toast.error("Failed to process image");
			console.error(error);
		}
	};

	const handleUpload = async () => {
		if (!selectedFile) return;
		await startUpload([selectedFile]);
	};

	const handleRemove = async () => {
		setIsRemoving(true);
		try {
			// Revoke blob URL to prevent memory leak before clearing state
			if (
				preview &&
				typeof preview === "string" &&
				preview.startsWith("blob:")
			) {
				URL.revokeObjectURL(preview);
			}
			// Send null to actually delete the signature
			await onUploadComplete(null, null);
			queryClient.invalidateQueries({
				queryKey: documentConfigKeys.global(),
			});
			toast.success(`${label} removed`);
			setPreview(null);
			setSelectedFile(null);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to remove image",
			);
		} finally {
			setIsRemoving(false);
		}
	};

	const handleClearPreview = () => {
		if (preview?.startsWith("blob:")) {
			URL.revokeObjectURL(preview);
		}
		setPreview(null);
		setSelectedFile(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const displayImage = preview ?? currentImageUrl ?? undefined;

	return (
		<div className="space-y-3">
			{displayImage && (
				<div className="flex justify-center">
					<div className="relative">
						<Image
							alt={`${label} preview`}
							className="h-24 w-auto rounded border object-contain"
							height={96}
							src={displayImage}
							unoptimized
							width={200}
						/>
						{preview && (
							<Button
								className="-right-2 -top-2 absolute size-6 rounded-full p-0"
								onClick={handleClearPreview}
								size="icon"
								variant="destructive"
							>
								<X className="h-3 w-3" />
							</Button>
						)}
					</div>
				</div>
			)}

			<div className="flex gap-2">
				{currentImageUrl && !preview ? (
					<Button
						className="flex-1"
						disabled={isRemoving}
						onClick={handleRemove}
						size="sm"
						type="button"
						variant="destructive"
					>
						{isRemoving ? (
							<>
								<Loader2 className="mr-2 h-3 w-3 animate-spin" />
								Removing...
							</>
						) : (
							"Remove"
						)}
					</Button>
				) : (
					<>
						<label
							className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-slate-300 border-dashed p-3 transition-colors hover:border-slate-400"
							htmlFor={`signature-input-${label}`}
						>
							<Camera className="mb-1 h-5 w-5 text-slate-400" />
							<p className="font-medium text-slate-700 text-xs">
								{preview ? "Change" : "Upload"}
							</p>
						</label>
						<input
							accept="image/jpeg,image/png,image/webp"
							className="hidden"
							id={`signature-input-${label}`}
							onChange={handleFileSelect}
							ref={fileInputRef}
							type="file"
						/>
					</>
				)}
				{selectedFile && (
					<Button
						disabled={isUploading}
						onClick={handleUpload}
						size="sm"
						type="button"
					>
						{isUploading ? (
							<>
								<Loader2 className="mr-2 h-3 w-3 animate-spin" />
								Uploading...
							</>
						) : (
							"Upload"
						)}
					</Button>
				)}
			</div>
		</div>
	);
}
