"use client";

import {
	AlertCircle,
	CheckCircle2,
	Clock,
	Download,
	FileSignature,
	FileText,
	Loader2,
	Lock,
	ShieldCheck,
	Upload,
	XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { UserBookingDetailVM } from "@/entities/booking/model/user-detail-types";
import {
	type DocumentVerificationStatus,
	getVerificationStatusLabel,
	useBookingDocuments,
	useDocumentVerificationState,
	verificationStatusColors,
} from "@/entities/booking-document";
import {
	BookingDocUploader,
	BookingDocumentsList,
} from "@/features/bookings/shared";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import { Separator } from "@/shared/ui/shadcn/separator";
import { formatDate } from "../lib/helpers";

type DocumentType = "service_form" | "working_area_agreement";

function VerificationBadge({ status }: { status: DocumentVerificationStatus }) {
	const colors = verificationStatusColors[status];
	const label = getVerificationStatusLabel(status);

	const icon =
		status === "verified" ? (
			<CheckCircle2 className="mr-1 h-3 w-3" />
		) : status === "rejected" ? (
			<XCircle className="mr-1 h-3 w-3" />
		) : status === "pending_verification" ? (
			<Clock className="mr-1 h-3 w-3" />
		) : (
			<Upload className="mr-1 h-3 w-3" />
		);

	return (
		<Badge
			className={cn("gap-1", colors.bg, colors.text, colors.border)}
			variant="outline"
		>
			{icon}
			{label}
		</Badge>
	);
}

export function UserDocumentsSection({
	booking,
}: {
	booking: UserBookingDetailVM;
}) {
	const [downloadingId, setDownloadingId] = useState<string | null>(null);
	const { data: verificationState } = useDocumentVerificationState(booking.id);

	// Expecting exactly one service form in this simplified UI
	const form = useMemo(() => booking.serviceForms[0], [booking.serviceForms]);

	// Fetch all booking documents to control single-file slots per type
	const { data: allDocs, isLoading: docsLoading } = useBookingDocuments(
		booking.id,
	);

	// Helper to check if a specific type already has an uploaded doc
	const hasDocOfType = (type: "service_form_signed" | "payment_receipt" | "workspace_form_signed") => {
		if (!allDocs) return false;
		return allDocs.some((d) => d.type === type);
	};

	const isResultsUnlocked =
		verificationState &&
		verificationState.serviceFormSigned === "verified" &&
		(verificationState.workspaceFormSigned === "verified" ||
			verificationState.workspaceFormSigned === "not_required") &&
		verificationState.paymentReceipt === "verified";

	const handleDownload = async (documentType: DocumentType) => {
		if (!form) return;
		const downloadId = `${documentType}-${form.id}`;
		setDownloadingId(downloadId);

		try {
			let filePath: string | null = null;
			let fileName = "";

			if (documentType === "service_form") {
				filePath = form.serviceFormUnsignedPdfPath;
				fileName = `ServiceForm_${form.formNumber}.pdf`;
			} else if (documentType === "working_area_agreement") {
				filePath = form.workingAreaAgreementUnsignedPdfPath;
				fileName = `WorkingAreaAgreement_${form.formNumber}.pdf`;
			}

			if (!filePath) {
				throw new Error("Document not available");
			}

			window.open(filePath, "_blank");
			toast.success("Opening document", { description: fileName });
		} catch (error) {
			toast.error("Download failed", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		} finally {
			setDownloadingId(null);
		}
	};

	if (!form) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<FileText className="h-5 w-5 text-slate-400" />
						Documents
					</CardTitle>
					<CardDescription>Service form and payment receipt</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="rounded-lg border border-slate-300 border-dashed bg-slate-50 p-8 text-center">
						<FileText className="mx-auto h-10 w-10 text-slate-300" />
						<p className="mt-2 font-medium text-slate-600">No documents yet</p>
						<p className="mt-1 text-slate-500 text-sm">
							Your documents will appear once the service form is generated.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-lg">
					<FileText className="h-5 w-5 text-slate-400" />
					Documents
				</CardTitle>
				<CardDescription>
					Download the service form and upload your signed form and payment
					receipt
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-6">
				{/* Verification Summary */}
				{verificationState && (
					<div
						className={cn(
							"rounded-lg border p-4",
							isResultsUnlocked
								? "border-green-200 bg-green-50"
								: "border-amber-200 bg-amber-50",
						)}
					>
						<div className="mb-2 flex items-center gap-2">
							{isResultsUnlocked ? (
								<ShieldCheck className="h-5 w-5 text-green-600" />
							) : (
								<Lock className="h-5 w-5 text-amber-600" />
							)}
							<span
								className={cn(
									"font-medium",
									isResultsUnlocked ? "text-green-800" : "text-amber-800",
								)}
							>
								{isResultsUnlocked
									? "Results Unlocked"
									: "Results Locked - Complete Verification"}
							</span>
						</div>

						<div className="grid gap-2 sm:grid-cols-3">
							<div className="flex items-center justify-between rounded border bg-white p-2">
								<span className="text-slate-600 text-xs">Service Form</span>
								<VerificationBadge
									status={verificationState.serviceFormSigned}
								/>
							</div>
							<div className="flex items-center justify-between rounded border bg-white p-2">
								<span className="text-slate-600 text-xs">
									{verificationState.requiresWorkspaceForm
										? "Workspace"
										: "Workspace (N/A)"}
								</span>
								<VerificationBadge
									status={verificationState.workspaceFormSigned}
								/>
							</div>
							<div className="flex items-center justify-between rounded border bg-white p-2">
								<span className="text-slate-600 text-xs">Payment</span>
								<VerificationBadge status={verificationState.paymentReceipt} />
							</div>
						</div>
					</div>
				)}

				{/* Single merged card */}
				<div className="rounded-lg border border-slate-200">
					{/* Header row: service form meta + download */}
					<div className="flex flex-col gap-3 border-b bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-3">
							<FileSignature className="h-5 w-5 text-purple-500" />
							<div>
								<p className="font-medium text-slate-900">
									Service Form {form.formNumber}
								</p>
								<p className="text-slate-400 text-xs">
									Generated: {formatDate(form.generatedAt)} • Valid until:{" "}
									{formatDate(form.validUntil)}
								</p>
							</div>
						</div>

						<Button
							disabled={downloadingId === `service_form-${form.id}`}
							onClick={() => handleDownload("service_form")}
							size="sm"
							variant="outline"
						>
							{downloadingId === `service_form-${form.id}` ? (
								<Loader2 className="mr-1 h-4 w-4 animate-spin" />
							) : (
								<Download className="mr-1 h-4 w-4" />
							)}
							Download unsigned form
						</Button>
					</div>

					{/* Upload area + latest uploads list in one body */}
					<div className="p-4">
						<div className="grid gap-4 md:grid-cols-2">
							{/* Signed Service Form single-file slot */}
							<div className="rounded border p-3">
								<div className="mb-2">
									<p className="font-medium text-slate-900">Signed Service Form</p>
									<p className="text-slate-500 text-xs">
										Upload the signed PDF copy of your service form
									</p>
								</div>
								{docsLoading ? (
									<div className="flex items-center justify-center py-4">
										<Loader2 className="h-4 w-4 animate-spin text-slate-400" />
									</div>
								) : hasDocOfType("service_form_signed") ? (
									<BookingDocumentsList
										bookingId={booking.id}
										filterTypes={["service_form_signed"]}
										showDelete
										showEmptyState={false}
									/>
								) : (
									<BookingDocUploader
										bookingId={booking.id}
										compact
										type="service_form_signed"
									/>
								)}
							</div>

							{/* Payment Receipt single-file slot */}
							<div className="rounded border p-3">
								<div className="mb-2">
									<p className="font-medium text-slate-900">Payment Receipt</p>
									<p className="text-slate-500 text-xs">
										Upload proof of payment (PDF or image)
									</p>
								</div>
								{docsLoading ? (
									<div className="flex items-center justify-center py-4">
										<Loader2 className="h-4 w-4 animate-spin text-slate-400" />
									</div>
								) : hasDocOfType("payment_receipt") ? (
									<BookingDocumentsList
										bookingId={booking.id}
										filterTypes={["payment_receipt"]}
										showDelete
										showEmptyState={false}
									/>
								) : (
									<BookingDocUploader
										bookingId={booking.id}
										compact
										type="payment_receipt"
									/>
								)}
							</div>

							{/* Optional workspace agreement single-file slot */}
							{form.requiresWorkingAreaAgreement && (
								<div className="rounded border p-3 md:col-span-2">
									<div className="mb-2 flex items-center justify-between">
										<div>
											<p className="font-medium text-slate-900">
												Signed Working Area Agreement
											</p>
											<p className="text-slate-500 text-xs">
												Upload your signed workspace agreement PDF
											</p>
										</div>
										<Button
											disabled={
												downloadingId === `working_area_agreement-${form.id}`
											}
											onClick={() => handleDownload("working_area_agreement")}
											size="sm"
											variant="outline"
										>
											{downloadingId === `working_area_agreement-${form.id}` ? (
												<Loader2 className="mr-1 h-4 w-4 animate-spin" />
											) : (
												<Download className="mr-1 h-4 w-4" />
											)}
											Download agreement
										</Button>
									</div>
									{docsLoading ? (
										<div className="flex items-center justify-center py-4">
											<Loader2 className="h-4 w-4 animate-spin text-slate-400" />
										</div>
									) : hasDocOfType("workspace_form_signed") ? (
										<BookingDocumentsList
											bookingId={booking.id}
											filterTypes={["workspace_form_signed"]}
											showDelete
											showEmptyState={false}
										/>
									) : (
										<BookingDocUploader
											bookingId={booking.id}
											compact
											type="workspace_form_signed"
										/>
									)}
								</div>
							)}
						</div>

						<Separator className="my-4" />



						<div className="mt-4 rounded border border-blue-200 bg-blue-50 p-3">
							<div className="flex gap-2">
								<AlertCircle className="h-5 w-5 shrink-0 text-blue-600" />
								<div className="text-blue-800 text-sm">
									<p className="font-medium">Instructions</p>
									<ul className="mt-1 list-inside list-disc space-y-1 text-blue-700 text-xs">
										<li>
											Download the service form, sign it, then upload the signed
											PDF.
										</li>
										<li>
											Upload your payment receipt after completing payment.
										</li>
										{form.requiresWorkingAreaAgreement && (
											<li>
												Workspace access requires the signed working area
												agreement.
											</li>
										)}
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
