"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	AlertCircle,
	Download,
	Eye,
	FileCheck,
	FilePlus,
	FileText,
	Loader2,
	RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { bookingKeys } from "@/entities/booking/api/query-keys";
import type { BookingCommandCenterVM } from "@/entities/booking/model/command-center-types";
import {
	bookingDocumentKeys,
	type DocumentType,
	getVerifiableDocumentTypes,
	useBookingDocuments,
} from "@/entities/booking-document";
import { useGenerateForms } from "@/entities/service-form";
import {
	BookingDocUploader,
	BookingDocumentsList,
} from "@/features/bookings/shared";
import { DocumentVerificationCard } from "@/features/document-verification";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";

interface UnifiedDocumentManagerProps {
	booking: BookingCommandCenterVM;
}

export function UnifiedDocumentManager({
	booking,
}: UnifiedDocumentManagerProps) {
	const generateForms = useGenerateForms();
	const queryClient = useQueryClient();

	// Fetch all documents
	const { data: documents } = useBookingDocuments(booking.id);

	// Filter for verification
	const verifiableTypes = getVerifiableDocumentTypes();
	const verifiableDocuments = documents?.filter((doc) =>
		verifiableTypes.includes(doc.type),
	);
	const pendingVerificationDocs =
		verifiableDocuments?.filter(
			(d) => d.verificationStatus === "pending_verification",
		) ?? [];

	// Service Forms Logic
	// Filter out service forms whose related documents have been deleted (for display only)
	// A form should only be shown if its required documents still exist
	// Match forms to documents by URL, not just by type
	const serviceForms = booking.serviceForms.filter((form) => {
		// Check if the specific service_form_unsigned document exists (match by URL)
		const hasServiceFormDoc = documents?.some(
			(doc) =>
				doc.type === "service_form_unsigned" &&
				doc.blob.url === form.serviceFormUnsignedPdfPath,
		);

		if (!hasServiceFormDoc) {
			return false;
		}

		// If form requires working area agreement, also check for the specific workspace_form_unsigned document
		if (form.requiresWorkingAreaAgreement) {
			if (!form.workingAreaAgreementUnsignedPdfPath) {
				return false;
			}
			const hasWorkspaceFormDoc = documents?.some(
				(doc) =>
					doc.type === "workspace_form_unsigned" &&
					doc.blob.url === form.workingAreaAgreementUnsignedPdfPath,
			);
			return hasWorkspaceFormDoc;
		}

		return true;
	});

	// Check if forms exist (for generation logic) - use filtered list
	// This ensures the button shows when all forms are filtered out due to deleted documents
	const hasServiceForm = serviceForms.length > 0;
	const hasBackendForms = booking.serviceForms.length > 0;
	const canGenerateForms = booking.status === "approved" && !hasServiceForm;

	// If forms exist in backend but are filtered out (documents deleted), allow regenerating
	const shouldShowRegenerateAll =
		!hasServiceForm && hasBackendForms && booking.status === "approved";

	// Mutations
	const regenerateForm = useMutation({
		mutationFn: async (formId: string) => {
			const res = await fetch(`/api/admin/forms/${formId}/regenerate`, {
				method: "POST",
			});
			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.error || "Failed to regenerate form");
			}
			return res.json();
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: bookingKeys.all });
			queryClient.invalidateQueries({
				queryKey: bookingDocumentKeys.byBooking(booking.id),
			});
			toast.success("Form regenerated successfully", {
				description: `New form number: ${data.serviceForm.formNumber}`,
			});
		},
		onError: (error) => {
			toast.error("Failed to regenerate form", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		},
	});

	const handleGenerateForms = () => {
		generateForms.mutate(booking.id, {
			onSuccess: (data) => {
				toast.success("Forms generated successfully", {
					description: `Form ${data.serviceForm.formNumber} is now ready for the customer to download and sign.`,
				});
			},
			onError: (error) => {
				toast.error("Failed to generate forms", {
					description:
						error instanceof Error ? error.message : "Unknown error occurred",
				});
			},
		});
	};

	// Handle regenerating the most recent form when documents are deleted
	const handleRegenerateMostRecentForm = () => {
		// Regenerate the first form (most recent)
		const firstForm = booking.serviceForms[0];
		if (firstForm) {
			regenerateForm.mutate(firstForm.id);
		}
	};

	const handlePreviewForm = (url: string | null | undefined, name: string) => {
		if (!url) {
			toast.error("Document not available");
			return;
		}
		window.open(url, "_blank");
		toast.success(`Opening ${name}`);
	};

	const handleDownloadForm = async (
		url: string | null | undefined,
		fileName: string,
	) => {
		if (!url) {
			toast.error("Document not available");
			return;
		}
		try {
			const response = await fetch(url);
			const blob = await response.blob();
			const downloadUrl = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = downloadUrl;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(downloadUrl);
			document.body.removeChild(a);
			toast.success("Download started", { description: fileName });
		} catch {
			toast.error("Download failed");
		}
	};

	return (
		<div className="space-y-6">
			{/* 1. Pending Verification Section (High Priority) */}
			{pendingVerificationDocs.length > 0 && (
				<Card className="border-amber-200 bg-amber-50/30">
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-amber-800 text-lg">
							<AlertCircle className="h-5 w-5" />
							Pending Verification
						</CardTitle>
						<CardDescription className="text-amber-700/80">
							{pendingVerificationDocs.length} document(s) require your review.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{pendingVerificationDocs.map((doc) => (
							<DocumentVerificationCard
								bookingId={booking.id}
								bookingReference={booking.referenceNumber}
								document={doc}
								key={doc.id}
							/>
						))}
					</CardContent>
				</Card>
			)}

			{/* 2. All Documents */}
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle>Documents</CardTitle>
						<div className="flex gap-2">
							{!hasServiceForm &&
								(shouldShowRegenerateAll ? (
									<Button
										className="h-8 gap-2 text-xs"
										disabled={regenerateForm.isPending}
										onClick={handleRegenerateMostRecentForm}
										size="sm"
									>
										{regenerateForm.isPending ? (
											<Loader2 className="h-3.5 w-3.5 animate-spin" />
										) : (
											<RefreshCw className="h-3.5 w-3.5" />
										)}
										Regenerate Forms
									</Button>
								) : (
									<Button
										className="h-8 gap-2 text-xs"
										disabled={!canGenerateForms || generateForms.isPending}
										onClick={handleGenerateForms}
										size="sm"
									>
										{generateForms.isPending ? (
											<Loader2 className="h-3.5 w-3.5 animate-spin" />
										) : (
											<FilePlus className="h-3.5 w-3.5" />
										)}
										Generate Forms
									</Button>
								))}
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* All Uploaded Documents (new system) */}
					<BookingDocumentsList
						bookingId={booking.id}
						excludeTypes={["sample_result"] as DocumentType[]}
						showDelete
						showEmptyState={serviceForms.length === 0}
						showUploader={false}
					/>

					{/* Service Forms */}
					{serviceForms.map((form) => (
						<div
							className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3"
							key={form.id}
						>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<FileCheck className="h-4 w-4 text-green-600" />
									<span className="font-medium text-slate-900 text-sm">
										{form.formNumber}
									</span>
								</div>
								<Badge variant="outline">
									{form.status === "signed_forms_uploaded"
										? "Signed"
										: form.status === "downloaded"
											? "Downloaded"
											: "Generated"}
								</Badge>
							</div>

							{/* Unsigned Service Form */}
							<div className="flex items-center justify-between rounded bg-white p-2 shadow-sm">
								<div className="flex items-center gap-2">
									<FileText className="h-3.5 w-3.5 text-slate-400" />
									<span className="text-slate-600 text-xs">
										Service Form (Unsigned)
									</span>
								</div>
								<div className="flex items-center gap-1">
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												className="h-7 w-7"
												onClick={() =>
													handlePreviewForm(
														form.serviceFormUnsignedPdfPath,
														"Service Form",
													)
												}
												size="icon"
												variant="ghost"
											>
												<Eye className="h-3.5 w-3.5" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>Preview</TooltipContent>
									</Tooltip>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												className="h-7 w-7"
												onClick={() =>
													handleDownloadForm(
														form.serviceFormUnsignedPdfPath,
														`Service_Form_${form.formNumber}.pdf`,
													)
												}
												size="icon"
												variant="ghost"
											>
												<Download className="h-3.5 w-3.5" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>Download</TooltipContent>
									</Tooltip>
								</div>
							</div>

							{/* Working Area Agreement */}
							{form.workingAreaAgreementUnsignedPdfPath && (
								<div className="flex items-center justify-between rounded bg-white p-2 shadow-sm">
									<div className="flex items-center gap-2">
										<FileText className="h-3.5 w-3.5 text-slate-400" />
										<span className="text-slate-600 text-xs">
											Working Area Agreement
										</span>
									</div>
									<div className="flex items-center gap-1">
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													className="h-7 w-7"
													onClick={() =>
														handlePreviewForm(
															form.workingAreaAgreementUnsignedPdfPath,
															"Working Area Agreement",
														)
													}
													size="icon"
													variant="ghost"
												>
													<Eye className="h-3.5 w-3.5" />
												</Button>
											</TooltipTrigger>
											<TooltipContent>Preview</TooltipContent>
										</Tooltip>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													className="h-7 w-7"
													onClick={() =>
														handleDownloadForm(
															form.workingAreaAgreementUnsignedPdfPath,
															`Working_Area_${form.formNumber}.pdf`,
														)
													}
													size="icon"
													variant="ghost"
												>
													<Download className="h-3.5 w-3.5" />
												</Button>
											</TooltipTrigger>
											<TooltipContent>Download</TooltipContent>
										</Tooltip>
									</div>
								</div>
							)}

							<Button
								className="mt-2 h-7 w-full gap-1.5 text-xs"
								disabled={regenerateForm.isPending}
								onClick={() => regenerateForm.mutate(form.id)}
								size="sm"
								variant="outline"
							>
								{regenerateForm.isPending ? (
									<Loader2 className="h-3 w-3 animate-spin" />
								) : (
									<RefreshCw className="h-3 w-3" />
								)}
								Regenerate Forms
							</Button>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}
