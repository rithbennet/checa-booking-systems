/**
 * BookingSidebar Component
 *
 * Right sidebar for the booking command center containing:
 * - Timeline Widget (target completion, urgent flag)
 * - Document Vault (client uploads, admin docs)
 * - Financial Gate (payment status, verification)
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { invoice_status_enum } from "generated/prisma";
import {
	CalendarClock,
	CheckCircle,
	ChevronDown,
	Download,
	ExternalLink,
	Eye,
	FileCheck,
	FilePlus,
	FileText,
	Loader2,
	Lock,
	Plus,
	RefreshCw,
	ShieldCheck,
	X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { bookingKeys } from "@/entities/booking/api/query-keys";
import type {
	BookingCommandCenterVM,
	InvoiceVM,
} from "@/entities/booking/model/command-center-types";
import {
	bookingDocumentKeys,
	useBookingDocuments,
} from "@/entities/booking-document";
import { useGenerateForms } from "@/entities/service-form";
import {
	BookingDocUploader,
	BookingDocumentsList,
} from "@/features/bookings/shared";
import { DocumentVerificationPanel } from "@/features/document-verification";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import { Checkbox } from "@/shared/ui/shadcn/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/shared/ui/shadcn/collapsible";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { formatCurrency, formatDate, getDaysRemaining } from "../lib/helpers";

interface BookingSidebarProps {
	booking: BookingCommandCenterVM;
}

// Timeline Widget Component
export function TimelineWidget({
	booking,
}: {
	booking: BookingCommandCenterVM;
}) {
	const [isUrgent, setIsUrgent] = useState(false);

	const targetDate = booking.preferredEndDate;
	const daysRemaining = getDaysRemaining(targetDate);

	return (
		<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
			<div className="mb-4 flex items-center justify-between">
				<h3 className="flex items-center gap-2 font-bold text-slate-900">
					<CalendarClock className="h-4 w-4 text-slate-400" />
					Timeline
				</h3>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							className="cursor-not-allowed text-slate-400 text-xs"
							type="button"
						>
							Edit
						</button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Timeline editing coming soon</p>
					</TooltipContent>
				</Tooltip>
			</div>

			<div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
				<p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">
					Target Completion
				</p>
				<p className="font-bold text-lg text-slate-900">
					{targetDate ? formatDate(targetDate) : "Not set"}
				</p>
				{daysRemaining !== null && (
					<p className="mt-0.5 text-[10px] text-slate-500">
						{daysRemaining > 0
							? `${daysRemaining} days remaining`
							: daysRemaining === 0
								? "Due today"
								: `${Math.abs(daysRemaining)} days overdue`}
					</p>
				)}
			</div>

			<div className="mt-3">
				<Tooltip>
					<TooltipTrigger asChild>
						<label
							className="flex cursor-not-allowed items-center gap-2 font-medium text-slate-400 text-xs"
							htmlFor="urgent-checkbox"
						>
							<Checkbox
								checked={isUrgent}
								className="rounded border-slate-300"
								disabled
								id="urgent-checkbox"
								onCheckedChange={(checked) => setIsUrgent(checked === true)}
							/>
							Flag as <span className="font-bold text-red-400">Urgent</span>
						</label>
					</TooltipTrigger>
					<TooltipContent>
						<p>Urgent flagging coming soon</p>
					</TooltipContent>
				</Tooltip>
			</div>
		</div>
	);
}

// Document Vault Component
export function DocumentVault({
	booking,
}: {
	booking: BookingCommandCenterVM;
}) {
	const [showInvoiceUpload, setShowInvoiceUpload] = useState(false);
	const generateForms = useGenerateForms();
	const queryClient = useQueryClient();

	// Regenerate form mutation
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

	// Verify signature mutation
	const verifySignature = useMutation({
		mutationFn: async (formId: string) => {
			const res = await fetch(`/api/admin/forms/${formId}/verify-signature`, {
				method: "POST",
			});
			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.error || "Failed to verify signature");
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: bookingKeys.all });
			toast.success("Signature verified", {
				description: "You can now verify payments for this booking",
			});
		},
		onError: (error) => {
			toast.error("Failed to verify signature", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		},
	});

	// Get all documents from service forms
	const serviceForms = booking.serviceForms;
	const invoices = serviceForms.flatMap((f) => f.invoices);
	const hasServiceForm = serviceForms.length > 0;

	// Can generate if booking is approved and no forms exist
	const canGenerateForms = booking.status === "approved" && !hasServiceForm;

	// Check if signatures need verification
	const formNeedingVerification = serviceForms.find(
		(f) => f.status === "signed_forms_uploaded" && !f.signedFormsUploadedBy,
	);

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
		<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
			<div className="flex items-center justify-between border-slate-100 border-b bg-slate-50/50 p-4">
				<h3 className="font-bold text-slate-900 text-sm">Documents</h3>
				<button
					className="text-blue-600 hover:text-blue-800"
					onClick={() => setShowInvoiceUpload(!showInvoiceUpload)}
					type="button"
				>
					<Plus className="h-4 w-4" />
				</button>
			</div>

			{/* Invoice Upload Section (collapsible) */}
			{showInvoiceUpload && (
				<div className="border-slate-100 border-b bg-blue-50/50 p-4">
					<p className="mb-2 font-medium text-blue-800 text-xs">
						Upload Invoice PDF
					</p>
					<BookingDocUploader
						bookingId={booking.id}
						compact
						label="Upload Invoice"
						onUploaded={() => setShowInvoiceUpload(false)}
						type="invoice"
					/>
				</div>
			)}

			{/* Signature Verification Banner */}
			{formNeedingVerification && (
				<div className="border-amber-200 border-b bg-amber-50 p-3">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<ShieldCheck className="h-4 w-4 text-amber-600" />
							<span className="font-medium text-amber-800 text-xs">
								Signed forms uploaded - verify signature
							</span>
						</div>
						<Button
							className="h-7 gap-1.5 text-xs"
							disabled={verifySignature.isPending}
							onClick={() => verifySignature.mutate(formNeedingVerification.id)}
							size="sm"
						>
							{verifySignature.isPending ? (
								<Loader2 className="h-3 w-3 animate-spin" />
							) : (
								<ShieldCheck className="h-3 w-3" />
							)}
							Verify
						</Button>
					</div>
				</div>
			)}

			{/* Client Uploads Section */}
			<div className="space-y-2 p-4">
				<p className="mb-2 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
					Client Uploads
				</p>

				{/* Show uploaded documents from new system */}
				<BookingDocumentsList
					bookingId={booking.id}
					filterTypes={[
						"service_form_signed",
						"workspace_form_signed",
						"payment_receipt",
					]}
					showDelete
					showEmptyState={false}
					showUploader
				/>

				{/* Legacy: Show service forms with signed paths */}
				{serviceForms
					.filter((f) => f.serviceFormSignedPdfPath)
					.map((form) => (
						<div
							className="group flex items-center gap-3 rounded border border-slate-200 bg-white p-2"
							key={form.id}
						>
							<FileCheck className="h-4 w-4 text-green-500" />
							<div className="flex-1 overflow-hidden">
								<p className="truncate font-medium text-slate-900 text-xs">
									Signed Service Form
								</p>
								<p className="text-[10px] text-slate-400">
									{form.formNumber} • {formatDate(form.generatedAt)}
								</p>
							</div>
							<div className="flex items-center gap-1">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											className="h-6 w-6"
											onClick={() =>
												handlePreviewForm(
													form.serviceFormSignedPdfPath,
													"Signed Service Form",
												)
											}
											size="icon"
											variant="ghost"
										>
											<Eye className="h-3 w-3" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Preview</TooltipContent>
								</Tooltip>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											className="h-6 w-6"
											onClick={() =>
												handleDownloadForm(
													form.serviceFormSignedPdfPath,
													`Signed_Service_Form_${form.formNumber}.pdf`,
												)
											}
											size="icon"
											variant="ghost"
										>
											<Download className="h-3 w-3" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Download</TooltipContent>
								</Tooltip>
							</div>
						</div>
					))}

				{serviceForms.filter((f) => f.serviceFormSignedPdfPath).length ===
					0 && (
					<p className="text-slate-400 text-xs italic">No client uploads yet</p>
				)}
			</div>

			{/* Admin / System Generated Documents */}
			<div className="border-slate-100 border-t bg-slate-50 p-4">
				<p className="mb-2 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
					Admin / System
				</p>
				<div className="space-y-2">
					{/* Show uploaded invoices from new system */}
					<BookingDocumentsList
						bookingId={booking.id}
						filterTypes={["invoice"]}
						showDelete
						showEmptyState={false}
						showUploader
					/>

					{/* Legacy Invoices */}
					{invoices.map((invoice) => (
						<InvoiceDocumentRow invoice={invoice} key={invoice.id} />
					))}

					{/* Generated Service Forms Preview */}
					{serviceForms.map((form) => (
						<div
							className="space-y-2 rounded border border-slate-200 bg-white p-3"
							key={form.id}
						>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<FileCheck className="h-4 w-4 text-green-500" />
									<span className="font-medium text-slate-900 text-xs">
										{form.formNumber}
									</span>
								</div>
								<Badge
									className={
										form.status === "signed_forms_uploaded"
											? "border-green-200 bg-green-100 text-green-700"
											: "border-slate-200 bg-slate-100 text-slate-600"
									}
									variant="outline"
								>
									{form.status === "signed_forms_uploaded"
										? "Signed"
										: form.status === "downloaded"
											? "Downloaded"
											: "Generated"}
								</Badge>
							</div>

							{/* Unsigned Service Form */}
							<div className="flex items-center justify-between rounded bg-slate-50 p-2">
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
												className="h-6 w-6"
												onClick={() =>
													handlePreviewForm(
														form.serviceFormUnsignedPdfPath,
														"Service Form",
													)
												}
												size="icon"
												variant="ghost"
											>
												<Eye className="h-3 w-3" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>Preview</TooltipContent>
									</Tooltip>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												className="h-6 w-6"
												onClick={() =>
													handleDownloadForm(
														form.serviceFormUnsignedPdfPath,
														`Service_Form_${form.formNumber}.pdf`,
													)
												}
												size="icon"
												variant="ghost"
											>
												<Download className="h-3 w-3" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>Download</TooltipContent>
									</Tooltip>
								</div>
							</div>

							{/* Working Area Agreement (if exists) */}
							{form.workingAreaAgreementUnsignedPdfPath && (
								<div className="flex items-center justify-between rounded bg-slate-50 p-2">
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
													className="h-6 w-6"
													onClick={() =>
														handlePreviewForm(
															form.workingAreaAgreementUnsignedPdfPath,
															"Working Area Agreement",
														)
													}
													size="icon"
													variant="ghost"
												>
													<Eye className="h-3 w-3" />
												</Button>
											</TooltipTrigger>
											<TooltipContent>Preview</TooltipContent>
										</Tooltip>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													className="h-6 w-6"
													onClick={() =>
														handleDownloadForm(
															form.workingAreaAgreementUnsignedPdfPath,
															`Working_Area_${form.formNumber}.pdf`,
														)
													}
													size="icon"
													variant="ghost"
												>
													<Download className="h-3 w-3" />
												</Button>
											</TooltipTrigger>
											<TooltipContent>Download</TooltipContent>
										</Tooltip>
									</div>
								</div>
							)}

							{/* Regenerate Button */}
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

					{/* Generate Service Form Button */}
					{!hasServiceForm && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									className="flex h-auto w-full items-center justify-center gap-2 rounded border border-slate-300 bg-white py-2 font-medium text-xs shadow-sm"
									disabled={!canGenerateForms || generateForms.isPending}
									onClick={handleGenerateForms}
									variant="outline"
								>
									{generateForms.isPending ? (
										<>
											<Loader2 className="h-3.5 w-3.5 animate-spin" />
											Generating...
										</>
									) : (
										<>
											<FilePlus className="h-3.5 w-3.5" />
											Generate Service Form
										</>
									)}
								</Button>
							</TooltipTrigger>
							{!canGenerateForms && (
								<TooltipContent>
									<p>
										{booking.status !== "approved"
											? "Booking must be approved first"
											: "Forms already generated"}
									</p>
								</TooltipContent>
							)}
						</Tooltip>
					)}
				</div>
			</div>
		</div>
	);
}

function InvoiceDocumentRow({ invoice }: { invoice: InvoiceVM }) {
	const statusConfig: Record<
		invoice_status_enum,
		{ label: string; className: string }
	> = {
		pending: {
			label: "Draft",
			className: "bg-yellow-50 text-yellow-700 border-yellow-100",
		},
		sent: {
			label: "Sent",
			className: "bg-blue-50 text-blue-700 border-blue-100",
		},
		paid: {
			label: "Paid",
			className: "bg-green-50 text-green-700 border-green-100",
		},
		overdue: {
			label: "Overdue",
			className: "bg-red-50 text-red-700 border-red-100",
		},
		cancelled: {
			label: "Cancelled",
			className: "bg-slate-50 text-slate-600 border-slate-100",
		},
	};

	const config = statusConfig[invoice.status];

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className="flex cursor-not-allowed items-center gap-3 rounded border border-slate-200 bg-white p-2">
					<FileText className="h-4 w-4 text-slate-400" />
					<div className="flex-1 overflow-hidden">
						<p className="truncate font-medium text-slate-900 text-xs">
							{invoice.invoiceNumber}.pdf
						</p>
						<Badge
							className={`${config.className} mt-1 text-[10px]`}
							variant="outline"
						>
							{config.label}
						</Badge>
					</div>
					{invoice.status === "pending" && (
						<Button
							className="h-auto cursor-not-allowed rounded bg-slate-400 px-2 py-1 text-white text-xs"
							disabled
							size="sm"
						>
							Send
						</Button>
					)}
				</div>
			</TooltipTrigger>
			<TooltipContent>
				<p>Invoice management coming soon</p>
			</TooltipContent>
		</Tooltip>
	);
}

// Financial Gate Component
export function FinancialGate({
	booking,
}: {
	booking: BookingCommandCenterVM;
}) {
	const [servicesOpen, setServicesOpen] = useState(false);
	const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
	const [verificationNotes, setVerificationNotes] = useState("");
	const [isVerifying, setIsVerifying] = useState(false);
	const [isRejecting, setIsRejecting] = useState(false);
	const queryClient = useQueryClient();

	// Fetch booking documents to get pending payment receipts
	const { data: documents } = useBookingDocuments(booking.id);
	const pendingPaymentDocs =
		documents?.filter(
			(doc) =>
				doc.type === "payment_receipt" &&
				doc.verificationStatus === "pending_verification",
		) ?? [];

	const totalAmount = Number.parseFloat(booking.totalAmount);
	const isPaid = booking.isPaid;
	const firstInvoice = booking.serviceForms[0]?.invoices[0];

	// Count total items
	const serviceCount = booking.serviceItems.length;
	const workspaceCount = booking.workspaceBookings.length;
	const totalItems = serviceCount + workspaceCount;

	// Check if there are pending payment docs or unverified payments flag
	const hasUnverifiedPayments =
		booking.hasUnverifiedPayments || pendingPaymentDocs.length > 0;

	const handleVerify = async (documentId: string) => {
		setIsVerifying(true);
		try {
			const res = await fetch(`/api/booking-docs/${documentId}/verify`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ notes: verificationNotes }),
			});
			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.error || "Failed to verify payment");
			}
			toast.success("Payment verified successfully");
			queryClient.invalidateQueries({ queryKey: bookingKeys.all });
			queryClient.invalidateQueries({
				queryKey: bookingDocumentKeys.byBooking(booking.id),
			});
			setVerificationNotes("");
			setVerificationDialogOpen(false);
		} catch (error) {
			toast.error("Failed to verify payment", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setIsVerifying(false);
		}
	};

	const handleReject = async (documentId: string) => {
		if (!verificationNotes.trim()) {
			toast.error("Please provide rejection notes");
			return;
		}
		setIsRejecting(true);
		try {
			const res = await fetch(`/api/booking-docs/${documentId}/reject`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ notes: verificationNotes }),
			});
			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.error || "Failed to reject payment");
			}
			toast.success("Payment rejected");
			queryClient.invalidateQueries({ queryKey: bookingKeys.all });
			queryClient.invalidateQueries({
				queryKey: bookingDocumentKeys.byBooking(booking.id),
			});
			setVerificationNotes("");
			setVerificationDialogOpen(false);
		} catch (error) {
			toast.error("Failed to reject payment", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setIsRejecting(false);
		}
	};

	return (
		<div className="relative overflow-hidden rounded-xl border-2 border-orange-100 bg-white shadow-sm">
			{/* Header */}
			<div className="relative z-10 flex items-center justify-between border-slate-100 border-b p-5">
				<h3 className="font-bold text-slate-900">Financial Gate</h3>
				<div className="flex items-center gap-2">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								className="h-auto cursor-not-allowed rounded border border-slate-200 bg-slate-100 px-2 py-1 font-medium text-[10px] text-slate-400"
								disabled
								size="sm"
								variant="outline"
							>
								+ Add Charge
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Add charges coming soon</p>
						</TooltipContent>
					</Tooltip>
				</div>
			</div>

			{/* Services Accordion */}
			<Collapsible onOpenChange={setServicesOpen} open={servicesOpen}>
				<CollapsibleTrigger className="flex w-full items-center justify-between border-slate-100 border-b bg-slate-50/50 px-5 py-3 text-left hover:bg-slate-50">
					<div className="flex items-center gap-2">
						<span className="font-medium text-slate-700 text-xs">
							Services & Items
						</span>
						<Badge
							className="border-slate-200 bg-slate-100 text-[10px] text-slate-600"
							variant="outline"
						>
							{totalItems} {totalItems === 1 ? "item" : "items"}
						</Badge>
					</div>
					<ChevronDown
						className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${servicesOpen ? "rotate-180" : ""}`}
					/>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<div className="divide-y divide-slate-100 bg-white">
						{booking.serviceItems.map((item) => (
							<div
								className="flex items-start justify-between px-5 py-3"
								key={item.id}
							>
								<div className="flex-1">
									<p className="font-medium text-slate-900 text-xs">
										{item.service.name}
									</p>
									<p className="text-[10px] text-slate-500">
										{item.quantity} {item.quantity === 1 ? "sample" : "samples"}
										{item.sampleName && ` • ${item.sampleName}`}
									</p>
								</div>
								<p className="font-bold text-slate-900 text-xs">
									{formatCurrency(item.totalPrice)}
								</p>
							</div>
						))}
						{booking.workspaceBookings.map((ws) => (
							<div
								className="flex items-start justify-between px-5 py-3"
								key={ws.id}
							>
								<div className="flex-1">
									<p className="font-medium text-slate-900 text-xs">
										Workspace Rental
									</p>
									<p className="text-[10px] text-slate-500">
										{formatDate(ws.startDate)} - {formatDate(ws.endDate)}
									</p>
								</div>
							</div>
						))}
						{totalItems === 0 && (
							<p className="px-5 py-3 text-center text-slate-400 text-xs italic">
								No services added
							</p>
						)}
					</div>
				</CollapsibleContent>
			</Collapsible>

			{/* Total and Payment Section */}
			<div className="relative z-10 p-5">
				<div className="mb-4 flex items-end justify-between">
					<div>
						<p className="font-bold text-[10px] text-slate-400 uppercase">
							Total Due
						</p>
						<p className="font-bold text-2xl text-slate-900">
							{formatCurrency(totalAmount)}
						</p>
						{firstInvoice && (
							<p className="mt-1 text-[10px] text-slate-400">
								Invoice #{firstInvoice.invoiceNumber} (
								{firstInvoice.status === "sent" ? "Sent" : firstInvoice.status})
							</p>
						)}
					</div>
					<Badge
						className={
							isPaid
								? "border-green-200 bg-green-100 text-green-700"
								: "border-orange-200 bg-orange-100 text-orange-700"
						}
						variant="outline"
					>
						{isPaid ? "Paid" : "Unpaid"}
					</Badge>
				</div>

				{/* Lock icon for unpaid bookings */}
				{!isPaid && (
					<div className="absolute top-0 right-0 opacity-5">
						<Lock className="h-20 w-20 text-slate-900" />
					</div>
				)}

				{hasUnverifiedPayments ? (
					<Button
						className="relative z-10 flex w-full items-center justify-center gap-2 rounded py-2.5 font-bold text-white text-xs shadow-sm"
						onClick={() => setVerificationDialogOpen(true)}
					>
						<CheckCircle className="h-4 w-4" />
						Verify Payment Proof
					</Button>
				) : (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								className="relative z-10 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded bg-slate-400 py-2.5 font-bold text-white text-xs shadow-sm"
								disabled
							>
								<CheckCircle className="h-4 w-4" />
								{isPaid ? "Payment Verified" : "Record Payment"}
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>
								{isPaid
									? "All payments verified"
									: "Payment recording coming soon"}
							</p>
						</TooltipContent>
					</Tooltip>
				)}
			</div>

			{/* Payment Verification Dialog */}
			<Dialog
				onOpenChange={setVerificationDialogOpen}
				open={verificationDialogOpen}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Verify Payment Proof</DialogTitle>
						<DialogDescription>
							Review and verify the payment proof uploaded by the customer.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						{pendingPaymentDocs.map((doc) => (
							<div
								className="rounded-lg border border-slate-200 bg-slate-50 p-4"
								key={doc.id}
							>
								<div className="mb-3 flex items-start justify-between">
									<div>
										<p className="font-bold text-slate-900">Payment Receipt</p>
										<p className="text-slate-600 text-sm">
											Uploaded: {formatDate(doc.createdAt)}
										</p>
										<p className="text-slate-500 text-xs">
											by {doc.createdBy.firstName} {doc.createdBy.lastName}
										</p>
									</div>
									<Badge className="bg-yellow-100 text-yellow-700">
										Pending Verification
									</Badge>
								</div>

								<div className="mb-3 flex items-center gap-2">
									<FileText className="h-4 w-4 text-slate-400" />
									<span className="text-slate-700 text-sm">
										{doc.blob.fileName}
									</span>
									<span className="text-slate-400 text-xs">
										({Math.round(doc.blob.sizeBytes / 1024)} KB)
									</span>
								</div>

								<a
									className="inline-flex items-center gap-2 text-blue-600 text-sm hover:underline"
									href={`/api/booking-docs/${doc.id}/download`}
									rel="noopener noreferrer"
									target="_blank"
								>
									<ExternalLink className="h-3 w-3" />
									View Payment Receipt
								</a>

								{doc.note && (
									<p className="mt-2 text-slate-600 text-sm">
										<span className="font-medium">Note:</span> {doc.note}
									</p>
								)}
							</div>
						))}
					</div>

					<div>
						<label
							className="mb-2 block font-medium text-slate-700 text-sm"
							htmlFor="verification-notes"
						>
							Verification Notes (Optional for approval, required for rejection)
						</label>
						<textarea
							className="w-full rounded border border-slate-300 bg-white p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							disabled={isVerifying || isRejecting}
							id="verification-notes"
							onChange={(e) => setVerificationNotes(e.target.value)}
							placeholder="Add any notes about the verification..."
							rows={3}
							value={verificationNotes}
						/>
					</div>

					<DialogFooter className="flex gap-2 sm:justify-between">
						<Button
							disabled={isVerifying || isRejecting}
							onClick={() => setVerificationDialogOpen(false)}
							variant="outline"
						>
							Cancel
						</Button>
						<div className="flex gap-2">
							<Button
								disabled={
									isVerifying || isRejecting || pendingPaymentDocs.length === 0
								}
								onClick={() => {
									const doc = pendingPaymentDocs[0];
									if (doc) handleReject(doc.id);
								}}
								variant="destructive"
							>
								{isRejecting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Rejecting...
									</>
								) : (
									<>
										<X className="mr-2 h-4 w-4" />
										Reject
									</>
								)}
							</Button>
							<Button
								disabled={
									isVerifying || isRejecting || pendingPaymentDocs.length === 0
								}
								onClick={() => {
									const doc = pendingPaymentDocs[0];
									if (doc) handleVerify(doc.id);
								}}
							>
								{isVerifying ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Verifying...
									</>
								) : (
									<>
										<CheckCircle className="mr-2 h-4 w-4" />
										Verify Payment
									</>
								)}
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// Main Sidebar Component
export function BookingSidebar({ booking }: BookingSidebarProps) {
	return (
		<div className="space-y-6">
			<TimelineWidget booking={booking} />
			<DocumentVault booking={booking} />
			{/* Document Verification Panel - Admin can verify user uploads */}
			<DocumentVerificationPanel
				bookingId={booking.id}
				bookingReference={booking.referenceNumber}
			/>
			<FinancialGate booking={booking} />
		</div>
	);
}
