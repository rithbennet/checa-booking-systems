"use client";

import { CheckCircle, ExternalLink, FileText, Loader2, X } from "lucide-react";
import type { BookingDocumentVM } from "@/entities/booking-document";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import { formatDate } from "../lib/helpers";

interface PaymentVerificationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	pendingPaymentDocs: BookingDocumentVM[];
	verificationNotes: string;
	onNotesChange: (notes: string) => void;
	onVerify: (documentId: string) => void;
	onReject: (documentId: string) => void;
	isVerifying: boolean;
	isRejecting: boolean;
}

export function PaymentVerificationDialog({
	open,
	onOpenChange,
	pendingPaymentDocs,
	verificationNotes,
	onNotesChange,
	onVerify,
	onReject,
	isVerifying,
	isRejecting,
}: PaymentVerificationDialogProps) {
	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Verify Payment Proof</DialogTitle>
					<DialogDescription>
						Review and verify the payment proof uploaded by the customer.{" "}
						{pendingPaymentDocs.length > 1 && (
							<span className="mt-1 block text-amber-600">
								Note: Processing the first pending document (
								{pendingPaymentDocs.length} total). Others can be verified from
								the document vault.
							</span>
						)}{" "}
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
						Verification Notes <span className="text-red-500">*</span> required
						for rejection
					</label>
					<textarea
						aria-invalid={isRejecting && verificationNotes.trim() === ""}
						className="w-full rounded border border-slate-300 bg-white p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						disabled={isVerifying || isRejecting}
						id="verification-notes"
						onChange={(e) => onNotesChange(e.target.value)}
						placeholder="Add any notes about the verification..."
						rows={3}
						value={verificationNotes}
					/>
					{isRejecting && verificationNotes.trim() === "" && (
						<p className="mt-1 text-red-500 text-xs">
							Notes are required to reject a payment
						</p>
					)}
				</div>

				<DialogFooter className="flex gap-2 sm:justify-between">
					<Button
						disabled={isVerifying || isRejecting}
						onClick={() => onOpenChange(false)}
						variant="outline"
					>
						Cancel
					</Button>
					<div className="flex gap-2">
						<Button
							disabled={
								isVerifying ||
								isRejecting ||
								pendingPaymentDocs.length === 0 ||
								verificationNotes.trim() === ""
							}
							onClick={() => {
								const doc = pendingPaymentDocs[0];
								if (doc) onReject(doc.id);
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
								if (doc) onVerify(doc.id);
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
	);
}
