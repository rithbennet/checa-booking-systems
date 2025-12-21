"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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

interface IkohzaHeadSectionProps {
	config: DocumentConfig;
}

export function IkohzaHeadSection({ config }: IkohzaHeadSectionProps) {
	const [formData, setFormData] = useState({
		name: config.ikohzaHead.name,
		title: config.ikohzaHead.title ?? "",
		department: config.ikohzaHead.department,
		institute: config.ikohzaHead.institute,
		university: config.ikohzaHead.university,
		address: config.ikohzaHead.address,
	});

	const [signatureBlobId, setSignatureBlobId] = useState<string | null>(
		config.ikohzaHead.signatureBlobId,
	);
	const [signatureImageUrl, setSignatureImageUrl] = useState<string | null>(
		config.ikohzaHead.signatureImageUrl,
	);

	// Sync local state when config prop changes
	useEffect(() => {
		setFormData({
			name: config.ikohzaHead.name,
			title: config.ikohzaHead.title ?? "",
			department: config.ikohzaHead.department,
			institute: config.ikohzaHead.institute,
			university: config.ikohzaHead.university,
			address: config.ikohzaHead.address,
		});
		setSignatureBlobId(config.ikohzaHead.signatureBlobId);
		setSignatureImageUrl(config.ikohzaHead.signatureImageUrl);
	}, [config.ikohzaHead]);

	const updateMutation = useUpdateDocumentConfig();

	// Check if there are any changes
	const hasChanges =
		formData.name !== config.ikohzaHead.name ||
		(formData.title || null) !== config.ikohzaHead.title ||
		formData.department !== config.ikohzaHead.department ||
		formData.institute !== config.ikohzaHead.institute ||
		formData.university !== config.ikohzaHead.university ||
		formData.address !== config.ikohzaHead.address ||
		signatureBlobId !== config.ikohzaHead.signatureBlobId ||
		signatureImageUrl !== config.ikohzaHead.signatureImageUrl;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await updateMutation.mutateAsync({
				ikohzaHead: {
					...formData,
					title: formData.title || null,
					signatureBlobId,
					signatureImageUrl,
				},
			});
			toast.success("Ikohza Head information updated");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to update");
		}
	};

	const handleSignatureUpload = async (
		blobId: string | null,
		imageUrl: string | null,
	) => {
		// Capture previous values for rollback
		const prevBlobId = signatureBlobId;
		const prevImageUrl = signatureImageUrl;

		// Optimistic update
		setSignatureBlobId(blobId);
		setSignatureImageUrl(imageUrl);

		try {
			await updateMutation.mutateAsync({
				ikohzaHead: {
					signatureBlobId: blobId,
					signatureImageUrl: imageUrl,
				},
			});
		} catch (error) {
			// Rollback on failure
			setSignatureBlobId(prevBlobId);
			setSignatureImageUrl(prevImageUrl);
			console.error("Failed to update signature:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to update signature",
			);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Ikohza Head Information</CardTitle>
				<CardDescription>
					Configure the Ikohza Head details for work area forms
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form className="space-y-6" onSubmit={handleSubmit}>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="ikohzaHead-name">Name</Label>
							<Input
								id="ikohzaHead-name"
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								required
								value={formData.name}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="ikohzaHead-title">Title (Optional)</Label>
							<Input
								id="ikohzaHead-title"
								onChange={(e) =>
									setFormData({ ...formData, title: e.target.value })
								}
								value={formData.title}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="ikohzaHead-department">Department</Label>
							<Input
								id="ikohzaHead-department"
								onChange={(e) =>
									setFormData({ ...formData, department: e.target.value })
								}
								required
								value={formData.department}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="ikohzaHead-institute">Institute</Label>
							<Input
								id="ikohzaHead-institute"
								onChange={(e) =>
									setFormData({ ...formData, institute: e.target.value })
								}
								required
								value={formData.institute}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="ikohzaHead-university">University</Label>
							<Input
								id="ikohzaHead-university"
								onChange={(e) =>
									setFormData({ ...formData, university: e.target.value })
								}
								required
								value={formData.university}
							/>
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label htmlFor="ikohzaHead-address">Address</Label>
							<Input
								id="ikohzaHead-address"
								onChange={(e) =>
									setFormData({ ...formData, address: e.target.value })
								}
								required
								value={formData.address}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label>Signature</Label>
						<SignatureUpload
							currentImageUrl={config.ikohzaHead.signatureImageUrl}
							label="Ikohza Head Signature"
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
