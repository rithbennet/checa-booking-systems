"use client";

import { Loader2, Plus, X } from "lucide-react";
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

interface LabGeneralSectionProps {
	config: DocumentConfig;
}

export function LabGeneralSection({ config }: LabGeneralSectionProps) {
	const [formData, setFormData] = useState({
		facilityName: config.facilityName,
		addressTitle: config.address.title,
		addressInstitute: config.address.institute,
		addressUniversity: config.address.university,
		addressStreet: config.address.street,
		addressCity: config.address.city,
		addressEmail: config.address.email,
		ccRecipients: [...config.ccRecipients],
		facilities: [...config.facilities],
	});

	const [newCcRecipient, setNewCcRecipient] = useState("");
	const [newFacility, setNewFacility] = useState("");

	const updateMutation = useUpdateDocumentConfig();

	// Check if there are any changes
	const hasChanges =
		formData.facilityName !== config.facilityName ||
		formData.addressTitle !== config.address.title ||
		formData.addressInstitute !== config.address.institute ||
		formData.addressUniversity !== config.address.university ||
		formData.addressStreet !== config.address.street ||
		formData.addressCity !== config.address.city ||
		formData.addressEmail !== config.address.email ||
		JSON.stringify(formData.ccRecipients.sort()) !==
			JSON.stringify([...config.ccRecipients].sort()) ||
		JSON.stringify(formData.facilities.sort()) !==
			JSON.stringify([...config.facilities].sort());

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await updateMutation.mutateAsync({
				facilityName: formData.facilityName,
				address: {
					title: formData.addressTitle,
					institute: formData.addressInstitute,
					university: formData.addressUniversity,
					street: formData.addressStreet,
					city: formData.addressCity,
					email: formData.addressEmail,
				},
				ccRecipients: formData.ccRecipients,
				facilities: formData.facilities,
			});
			toast.success("Lab general information updated");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to update");
		}
	};

	const addCcRecipient = () => {
		if (
			newCcRecipient.trim() &&
			!formData.ccRecipients.includes(newCcRecipient.trim())
		) {
			setFormData({
				...formData,
				ccRecipients: [...formData.ccRecipients, newCcRecipient.trim()],
			});
			setNewCcRecipient("");
		}
	};

	const removeCcRecipient = (index: number) => {
		setFormData({
			...formData,
			ccRecipients: formData.ccRecipients.filter((_, i) => i !== index),
		});
	};

	const addFacility = () => {
		if (
			newFacility.trim() &&
			!formData.facilities.includes(newFacility.trim())
		) {
			setFormData({
				...formData,
				facilities: [...formData.facilities, newFacility.trim()],
			});
			setNewFacility("");
		}
	};

	const removeFacility = (index: number) => {
		setFormData({
			...formData,
			facilities: formData.facilities.filter((_, i) => i !== index),
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Lab General Information</CardTitle>
				<CardDescription>
					Configure facility name, address, CC recipients, and available
					facilities
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form className="space-y-6" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="facilityName">Facility Name</Label>
						<Input
							id="facilityName"
							onChange={(e) =>
								setFormData({ ...formData, facilityName: e.target.value })
							}
							required
							value={formData.facilityName}
						/>
					</div>

					<div className="space-y-4">
						<h3 className="font-semibold text-sm">Address</h3>
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="address-title">Title</Label>
								<Input
									id="address-title"
									onChange={(e) =>
										setFormData({
											...formData,
											addressTitle: e.target.value,
										})
									}
									required
									value={formData.addressTitle}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="address-institute">Institute</Label>
								<Input
									id="address-institute"
									onChange={(e) =>
										setFormData({
											...formData,
											addressInstitute: e.target.value,
										})
									}
									required
									value={formData.addressInstitute}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="address-university">University</Label>
								<Input
									id="address-university"
									onChange={(e) =>
										setFormData({
											...formData,
											addressUniversity: e.target.value,
										})
									}
									required
									value={formData.addressUniversity}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="address-email">Email</Label>
								<Input
									id="address-email"
									onChange={(e) =>
										setFormData({
											...formData,
											addressEmail: e.target.value,
										})
									}
									required
									type="email"
									value={formData.addressEmail}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="address-street">Street</Label>
								<Input
									id="address-street"
									onChange={(e) =>
										setFormData({
											...formData,
											addressStreet: e.target.value,
										})
									}
									required
									value={formData.addressStreet}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="address-city">City</Label>
								<Input
									id="address-city"
									onChange={(e) =>
										setFormData({
											...formData,
											addressCity: e.target.value,
										})
									}
									required
									value={formData.addressCity}
								/>
							</div>
						</div>
					</div>

					<div className="space-y-3">
						<Label>CC Recipients</Label>
						<div className="flex gap-2">
							<Input
								onChange={(e) => setNewCcRecipient(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										addCcRecipient();
									}
								}}
								placeholder="Add CC recipient"
								value={newCcRecipient}
							/>
							<Button
								onClick={(e) => {
									e.preventDefault();
									addCcRecipient();
								}}
								type="button"
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
						{formData.ccRecipients.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{formData.ccRecipients.map((recipient, i) => (
									<div
										className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-sm"
										key={recipient}
									>
										<span>{recipient}</span>
										<button
											className="text-slate-500 hover:text-slate-700"
											onClick={(e) => {
												e.preventDefault();
												removeCcRecipient(i);
											}}
											type="button"
										>
											<X className="h-3 w-3" />
										</button>
									</div>
								))}
							</div>
						)}
					</div>

					<div className="space-y-3">
						<Label>Facilities</Label>
						<div className="flex gap-2">
							<Input
								onChange={(e) => setNewFacility(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										addFacility();
									}
								}}
								placeholder="Add facility"
								value={newFacility}
							/>
							<Button
								onClick={(e) => {
									e.preventDefault();
									addFacility();
								}}
								type="button"
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
						{formData.facilities.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{formData.facilities.map((facility, i) => (
									<div
										className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-sm"
										key={facility}
									>
										<span>{facility}</span>
										<button
											className="text-slate-500 hover:text-slate-700"
											onClick={(e) => {
												e.preventDefault();
												removeFacility(i);
											}}
											type="button"
										>
											<X className="h-3 w-3" />
										</button>
									</div>
								))}
							</div>
						)}
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
