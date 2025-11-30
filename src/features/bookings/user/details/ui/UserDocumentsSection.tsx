/**
 * UserDocumentsSection Component
 *
 * Section for users to view and download service forms, invoices,
 * and upload signed documents.
 */

"use client";

import {
	AlertCircle,
	CheckCircle2,
	Clock,
	Download,
	FileSignature,
	FileText,
	Receipt,
	Upload,
} from "lucide-react";
import { useState } from "react";
import type { UserBookingDetailVM } from "@/entities/booking/model/user-detail-types";
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
import { formatCurrency, formatDate } from "../lib/helpers";

interface UserDocumentsSectionProps {
	booking: UserBookingDetailVM;
}

type DocumentType = "service_form" | "invoice" | "working_area_agreement";

function getStatusBadge(status: string, dueDate?: string) {
	const isOverdue = dueDate && new Date(dueDate) < new Date();

	if (status === "signed_forms_uploaded" || status === "paid") {
		return (
			<Badge
				className="border-green-200 bg-green-100 text-green-700"
				variant="outline"
			>
				<CheckCircle2 className="mr-1 h-3 w-3" />
				{status === "signed_forms_uploaded" ? "Signed" : "Paid"}
			</Badge>
		);
	}

	if (status === "overdue" || isOverdue) {
		return (
			<Badge
				className="border-red-200 bg-red-100 text-red-700"
				variant="outline"
			>
				<AlertCircle className="mr-1 h-3 w-3" />
				Overdue
			</Badge>
		);
	}

	if (
		status === "pending" ||
		status === "generated" ||
		status === "downloaded"
	) {
		return (
			<Badge
				className="border-yellow-200 bg-yellow-100 text-yellow-700"
				variant="outline"
			>
				<Clock className="mr-1 h-3 w-3" />
				{status === "generated" ? "Awaiting Signature" : "Pending"}
			</Badge>
		);
	}

	if (status === "sent") {
		return (
			<Badge
				className="border-blue-200 bg-blue-100 text-blue-700"
				variant="outline"
			>
				<FileText className="mr-1 h-3 w-3" />
				Sent
			</Badge>
		);
	}

	return <Badge variant="outline">{status}</Badge>;
}

function DocumentIcon({ type }: { type: DocumentType }) {
	switch (type) {
		case "service_form":
			return <FileSignature className="h-5 w-5 text-purple-500" />;
		case "invoice":
			return <Receipt className="h-5 w-5 text-blue-500" />;
		case "working_area_agreement":
			return <FileText className="h-5 w-5 text-orange-500" />;
		default:
			return <FileText className="h-5 w-5 text-slate-500" />;
	}
}

export function UserDocumentsSection({ booking }: UserDocumentsSectionProps) {
	const [uploadingId, setUploadingId] = useState<string | null>(null);

	// Handle document download (placeholder - would need actual API)
	const handleDownload = (documentType: string, documentId: string) => {
		// TODO: Implement actual download via API
		console.log("Download:", documentType, documentId);
	};

	// Handle signed form upload (placeholder - would need actual API)
	const handleUpload = async (formId: string) => {
		setUploadingId(formId);
		// TODO: Implement actual upload via file input and API
		setTimeout(() => setUploadingId(null), 1000);
	};

	// Show empty state if no service forms
	if (booking.serviceForms.length === 0) {
		return (
			<Card className="mb-6">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<FileText className="h-5 w-5 text-slate-400" />
						Documents
					</CardTitle>
					<CardDescription>
						Service forms, invoices, and signed documents
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="rounded-lg border border-slate-300 border-dashed bg-slate-50 p-8 text-center">
						<FileText className="mx-auto h-10 w-10 text-slate-300" />
						<p className="mt-2 font-medium text-slate-600">No documents yet</p>
						<p className="mt-1 text-slate-500 text-sm">
							Documents will appear here once your booking is approved and
							service forms are generated.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="mb-6">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<FileText className="h-5 w-5 text-slate-400" />
					Documents
				</CardTitle>
				<CardDescription>
					Download service forms and invoices, upload signed documents
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{booking.serviceForms.map((form) => (
					<div className="space-y-3" key={form.id}>
						{/* Service Form */}
						<div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
							<div className="flex items-center gap-3">
								<DocumentIcon type="service_form" />
								<div>
									<p className="font-medium text-slate-900">Service Form</p>
									<p className="text-slate-500 text-sm">{form.formNumber}</p>
									<p className="text-slate-400 text-xs">
										Generated: {formatDate(form.generatedAt)} • Valid until:{" "}
										{formatDate(form.validUntil)}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								{getStatusBadge(form.status)}
								<div className="flex gap-2">
									<Button
										onClick={() => handleDownload("service_form", form.id)}
										size="sm"
										variant="outline"
									>
										<Download className="mr-1 h-4 w-4" />
										Download
									</Button>
									{form.status !== "signed_forms_uploaded" && (
										<Button
											disabled={uploadingId === form.id}
											onClick={() => handleUpload(form.id)}
											size="sm"
											variant="default"
										>
											<Upload className="mr-1 h-4 w-4" />
											{uploadingId === form.id
												? "Uploading..."
												: "Upload Signed"}
										</Button>
									)}
								</div>
							</div>
						</div>

						{/* Working Area Agreement (if required) */}
						{form.requiresWorkingAreaAgreement && (
							<div className="ml-6 flex items-center justify-between rounded-lg border border-slate-200 p-4">
								<div className="flex items-center gap-3">
									<DocumentIcon type="working_area_agreement" />
									<div>
										<p className="font-medium text-slate-900">
											Working Area Agreement
										</p>
										<p className="text-slate-500 text-sm">
											Required for workspace access
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									{getStatusBadge(form.status)}
									<div className="flex gap-2">
										<Button
											onClick={() =>
												handleDownload("working_area_agreement", form.id)
											}
											size="sm"
											variant="outline"
										>
											<Download className="mr-1 h-4 w-4" />
											Download
										</Button>
										{form.status !== "signed_forms_uploaded" && (
											<Button
												disabled={uploadingId === `waa-${form.id}`}
												onClick={() => handleUpload(`waa-${form.id}`)}
												size="sm"
												variant="default"
											>
												<Upload className="mr-1 h-4 w-4" />
												Upload Signed
											</Button>
										)}
									</div>
								</div>
							</div>
						)}

						{/* Invoices for this form */}
						{form.invoices.length > 0 && (
							<div className="ml-6 space-y-2">
								<p className="mb-2 font-medium text-slate-500 text-xs uppercase tracking-wider">
									Invoices
								</p>
								{form.invoices.map((invoice) => (
									<div
										className={cn(
											"flex items-center justify-between rounded-lg border p-4",
											invoice.status === "overdue"
												? "border-red-200 bg-red-50"
												: "border-slate-200 bg-white",
										)}
										key={invoice.id}
									>
										<div className="flex items-center gap-3">
											<DocumentIcon type="invoice" />
											<div>
												<p className="font-medium text-slate-900">
													Invoice {invoice.invoiceNumber}
												</p>
												<p className="text-slate-500 text-sm">
													Amount:{" "}
													{formatCurrency(Number.parseFloat(invoice.amount))}
												</p>
												<p className="text-slate-400 text-xs">
													Issued: {formatDate(invoice.invoiceDate)} • Due:{" "}
													{formatDate(invoice.dueDate)}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-3">
											{getStatusBadge(invoice.status, invoice.dueDate)}
											<Button
												onClick={() => handleDownload("invoice", invoice.id)}
												size="sm"
												variant="outline"
											>
												<Download className="mr-1 h-4 w-4" />
												Download
											</Button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				))}

				{/* Info Banner */}
				<div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
					<div className="flex gap-3">
						<AlertCircle className="h-5 w-5 shrink-0 text-blue-600" />
						<div className="text-blue-800 text-sm">
							<p className="font-medium">Document Instructions</p>
							<ul className="mt-1 list-inside list-disc space-y-1 text-blue-700 text-xs">
								<li>
									Download and print the service form, sign it, and upload the
									signed copy
								</li>
								<li>
									Download invoices for your records and payment processing
								</li>
								{booking.serviceForms.some(
									(f) => f.requiresWorkingAreaAgreement,
								) && (
									<li>
										Working area agreement must be signed before workspace
										access
									</li>
								)}
							</ul>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
