"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useUpdateDocumentConfig } from "@/entities/document-config/api";
import type { DocumentConfig } from "@/entities/document-config/model/types";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import { SignatureUpload } from "./SignatureUpload";

interface StaffPicSectionProps {
	config: DocumentConfig;
}

export function StaffPicSection({ config }: StaffPicSectionProps) {
	const [formData, setFormData] = useState({
		name: config.staffPic.name,
		fullName: config.staffPic.fullName,
		email: config.staffPic.email,
		phone: config.staffPic.phone ?? "",
		title: config.staffPic.title ?? "",
	});

	const [signatureBlobId, setSignatureBlobId] = useState<string | null>(
		config.staffPic.signatureBlobId,
	);
	const [signatureImageUrl, setSignatureImageUrl] = useState<string | null>(
		config.staffPic.signatureImageUrl,
	);

	const updateMutation = useUpdateDocumentConfig();

	// Check if there are any changes
	const hasChanges =
		formData.name !== config.staffPic.name ||
		formData.fullName !== config.staffPic.fullName ||
		formData.email !== config.staffPic.email ||
		(formData.phone || null) !== config.staffPic.phone ||
		(formData.title || null) !== config.staffPic.title ||
		signatureBlobId !== config.staffPic.signatureBlobId ||
		signatureImageUrl !== config.staffPic.signatureImageUrl;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await updateMutation.mutateAsync({
				staffPic: {
					...formData,
					phone: formData.phone || null,
					title: formData.title || null,
				},
			});
			toast.success("Staff PIC information updated");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to update");
		}
	};

	const handleSignatureUpload = async (
		blobId: string | null,
		imageUrl: string | null,
	) => {
		setSignatureBlobId(blobId);
		setSignatureImageUrl(imageUrl);

		await updateMutation.mutateAsync({
			staffPic: {
				signatureBlobId: blobId,
				signatureImageUrl: imageUrl,
			},
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Staff PIC Information</CardTitle>
				<CardDescription>
					Configure the Person In Charge (PIC) details for service forms
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form className="space-y-6" onSubmit={handleSubmit}>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="staffPic-name">Name</Label>
							<Input
								id="staffPic-name"
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								required
								value={formData.name}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="staffPic-fullName">Full Name</Label>
							<Input
								id="staffPic-fullName"
								onChange={(e) =>
									setFormData({ ...formData, fullName: e.target.value })
								}
								required
								value={formData.fullName}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="staffPic-email">Email</Label>
							<Input
								id="staffPic-email"
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
								required
								type="email"
								value={formData.email}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="staffPic-phone">Phone (Optional)</Label>
							<Input
								id="staffPic-phone"
								onChange={(e) =>
									setFormData({ ...formData, phone: e.target.value })
								}
								type="tel"
								value={formData.phone}
							/>
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label htmlFor="staffPic-title">Title (Optional)</Label>
							<Input
								id="staffPic-title"
								onChange={(e) =>
									setFormData({ ...formData, title: e.target.value })
								}
								value={formData.title}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label>Signature</Label>
						<SignatureUpload
							currentImageUrl={config.staffPic.signatureImageUrl}
							label="Staff PIC Signature"
							onUploadComplete={handleSignatureUpload}
						/>
					</div>

					<div className="flex justify-end">
						<Button
							disabled={updateMutation.isPending || !hasChanges}
							type="submit"
						>
							{updateMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : (
								"Save Changes"
							)}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
