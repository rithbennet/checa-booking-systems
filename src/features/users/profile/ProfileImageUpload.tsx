"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useUserProfile } from "@/entities/user";
import { userKeys } from "@/entities/user/api/query-keys";
import { useUploadThing } from "@/shared/lib/uploadthing";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/ui/shadcn/dialog";

/**
 * Validate image file
 */
function validateImageFile(file: File): { valid: boolean; error?: string } {
	// Check file type
	const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
	if (!validTypes.includes(file.type)) {
		return {
			valid: false,
			error: "Please select a JPEG, PNG, or WebP image",
		};
	}

	// Check file size (2MB max)
	const maxSize = 2 * 1024 * 1024; // 2MB
	if (file.size > maxSize) {
		return {
			valid: false,
			error: "Image size must be less than 2MB",
		};
	}

	return { valid: true };
}

interface ProfileImageUploadProps {
	currentImageUrl: string | null;
}

export function ProfileImageUpload({
	currentImageUrl,
}: ProfileImageUploadProps) {
	const [open, setOpen] = useState(false);
	const [preview, setPreview] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();
	const { refetch } = useUserProfile();

	// Use uploadthing hook for profile image uploads
	// Note: The uploadthing handler already updates the profile image URL in the database
	const { startUpload, isUploading } = useUploadThing("profileImage", {
		onClientUploadComplete: async () => {
			// Uploadthing handler already updated the profile image URL
			// Just refresh the UI
			queryClient.invalidateQueries({ queryKey: userKeys.profile() });
			await refetch();

			toast.success("Profile picture updated successfully");
			setOpen(false);
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

		// Validate file
		const validation = validateImageFile(file);
		if (!validation.valid) {
			toast.error(validation.error || "Invalid image file");
			return;
		}

		// Create preview URL and store file
		try {
			const previewUrl = URL.createObjectURL(file);
			setPreview(previewUrl);
			setSelectedFile(file);
		} catch (error) {
			toast.error("Failed to process image");
			console.error(error);
		}
	};

	const handleUpload = async () => {
		if (!selectedFile) return;

		// Start upload using uploadthing
		await startUpload([selectedFile]);
	};

	const handleRemove = async () => {
		if (!currentImageUrl) return;

		try {
			const res = await fetch("/api/user/profile-image", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ imageUrl: null }),
			});

			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.error || "Failed to remove image");
			}

			// Invalidate profile query to refresh UI
			queryClient.invalidateQueries({ queryKey: userKeys.profile() });
			await refetch();

			toast.success("Profile picture removed");
			setOpen(false);
			setPreview(null);
			setSelectedFile(null);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to remove image",
			);
		}
	};

	// Cleanup preview URL when component unmounts or preview changes
	const handleClose = () => {
		if (preview?.startsWith("blob:")) {
			URL.revokeObjectURL(preview);
		}
		setOpen(false);
		setPreview(null);
		setSelectedFile(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<Dialog
			onOpenChange={(isOpen) => (isOpen ? setOpen(true) : handleClose())}
			open={open}
		>
			<DialogTrigger asChild>
				<Button className="mt-2" size="sm" variant="outline">
					<Camera className="mr-2 h-4 w-4" />
					{currentImageUrl ? "Change Photo" : "Upload Photo"}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						{currentImageUrl
							? "Change Profile Picture"
							: "Upload Profile Picture"}
					</DialogTitle>
					<DialogDescription>
						Upload a JPEG, PNG, or WebP image. Maximum size: 2MB.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Preview */}
					{(preview || currentImageUrl) && (
						<div className="flex justify-center">
							<div className="relative">
								<Image
									alt="Profile preview"
									className="size-32 rounded-full object-cover"
									height={128}
									src={preview || currentImageUrl || ""}
									unoptimized
									width={128}
								/>
								{preview && (
									<Button
										className="-right-2 -top-2 absolute size-6 rounded-full p-0"
										onClick={() => {
											if (preview.startsWith("blob:")) {
												URL.revokeObjectURL(preview);
											}
											setPreview(null);
											setSelectedFile(null);
											if (fileInputRef.current) {
												fileInputRef.current.value = "";
											}
										}}
										size="icon"
										variant="destructive"
									>
										<X className="h-3 w-3" />
									</Button>
								)}
							</div>
						</div>
					)}

					{/* File Input */}
					<div className="space-y-2">
						<label
							className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-slate-300 border-dashed p-6 transition-colors hover:border-slate-400"
							htmlFor="profile-image-input"
						>
							<Camera className="mb-2 h-8 w-8 text-slate-400" />
							<p className="font-medium text-slate-700 text-sm">
								Click to select an image
							</p>
							<p className="text-slate-500 text-xs">
								JPEG, PNG, or WebP (max 2MB)
							</p>
						</label>
						<input
							accept="image/jpeg,image/jpg,image/png,image/webp"
							className="hidden"
							id="profile-image-input"
							onChange={handleFileSelect}
							ref={fileInputRef}
							type="file"
						/>
					</div>
				</div>

				<DialogFooter>
					{currentImageUrl && (
						<Button
							disabled={isUploading}
							onClick={handleRemove}
							type="button"
							variant="destructive"
						>
							Remove Photo
						</Button>
					)}
					<Button
						disabled={isUploading || !selectedFile}
						onClick={handleUpload}
						type="button"
					>
						{isUploading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Uploading...
							</>
						) : (
							"Upload"
						)}
					</Button>
					<Button
						disabled={isUploading}
						onClick={handleClose}
						type="button"
						variant="outline"
					>
						Cancel
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
