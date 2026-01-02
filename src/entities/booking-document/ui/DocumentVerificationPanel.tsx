"use client";

import { AlertCircle, FileCheck2, ShieldCheck } from "lucide-react";
import {
	DocumentVerificationCard,
	getVerifiableDocumentTypes,
	useBookingDocuments,
	useDocumentVerificationState,
	VerificationStatusBadge,
} from "@/entities/booking-document";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import { Skeleton } from "@/shared/ui/shadcn/skeleton";

interface DocumentVerificationPanelProps {
	bookingId: string;
	bookingReference: string;
}

export function DocumentVerificationPanel({
	bookingId,
	bookingReference,
}: DocumentVerificationPanelProps) {
	const { data: documents, isLoading: documentsLoading } =
		useBookingDocuments(bookingId);
	const { data: verificationState, isLoading: stateLoading } =
		useDocumentVerificationState(bookingId);

	const isLoading = documentsLoading || stateLoading;

	// Get only verifiable document types (user uploads that need admin review)
	const verifiableTypes = getVerifiableDocumentTypes();
	const verifiableDocuments = documents?.filter((doc) =>
		verifiableTypes.includes(doc.type),
	);

	const pendingCount =
		verifiableDocuments?.filter(
			(d) => d.verificationStatus === "pending_verification",
		).length ?? 0;

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent className="space-y-4">
					<Skeleton className="h-32 w-full" />
					<Skeleton className="h-32 w-full" />
				</CardContent>
			</Card>
		);
	}

	if (!verifiableDocuments || verifiableDocuments.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ShieldCheck className="h-5 w-5 text-slate-400" />
						Document Verification
					</CardTitle>
					<CardDescription>
						No documents have been uploaded for verification yet.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-3 rounded-lg border border-slate-300 border-dashed bg-slate-50 p-6">
						<AlertCircle className="h-8 w-8 text-slate-400" />
						<div>
							<p className="font-medium text-slate-600 text-sm">
								Awaiting User Uploads
							</p>
							<p className="text-slate-500 text-xs">
								The user needs to upload signed forms and payment receipt.
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<ShieldCheck className="h-5 w-5 text-blue-600" />
							Document Verification
						</CardTitle>
						<CardDescription>
							Review and verify user-uploaded documents
						</CardDescription>
					</div>
					{pendingCount > 0 && (
						<div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1">
							<span className="font-bold text-amber-700 text-sm">
								{pendingCount}
							</span>
							<span className="text-amber-600 text-xs">pending review</span>
						</div>
					)}
				</div>
			</CardHeader>
			<CardContent>
				{/* Verification Status Summary */}
				{verificationState && (
					<div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
						<p className="mb-3 font-medium text-slate-700 text-sm">
							Verification Progress
						</p>
						<div className="grid gap-3 sm:grid-cols-3">
							<div className="flex items-center justify-between rounded border bg-white p-2">
								<span className="text-slate-600 text-xs">
									Signed Service Form
								</span>
								<VerificationStatusBadge
									status={verificationState.serviceFormSigned}
								/>
							</div>
							<div className="flex items-center justify-between rounded border bg-white p-2">
								<span className="text-slate-600 text-xs">
									{verificationState.requiresWorkspaceForm
										? "Workspace Agreement"
										: "Workspace (N/A)"}
								</span>
								<VerificationStatusBadge
									status={verificationState.workspaceFormSigned}
								/>
							</div>
							<div className="flex items-center justify-between rounded border bg-white p-2">
								<span className="text-slate-600 text-xs">Payment Receipt</span>
								<VerificationStatusBadge
									status={verificationState.paymentReceipt}
								/>
							</div>
						</div>

						{/* Gate Status */}
						<div className="mt-4 flex items-center gap-2 border-slate-200 border-t pt-3">
							<FileCheck2
								className={
									verificationState.serviceFormSigned === "verified" &&
									(verificationState.workspaceFormSigned === "verified" ||
										verificationState.workspaceFormSigned === "not_required") &&
									verificationState.paymentReceipt === "verified"
										? "h-5 w-5 text-green-600"
										: "h-5 w-5 text-amber-500"
								}
							/>
							<span className="font-medium text-sm">
								{verificationState.serviceFormSigned === "verified" &&
								(verificationState.workspaceFormSigned === "verified" ||
									verificationState.workspaceFormSigned === "not_required") &&
								verificationState.paymentReceipt === "verified"
									? "✓ Results Unlocked - User can download analysis results"
									: "⚠ Results Locked - Pending document verification"}
							</span>
						</div>
					</div>
				)}

				{/* Document Cards */}
				<div className="space-y-4">
					{verifiableDocuments.map((doc) => (
						<DocumentVerificationCard
							bookingId={bookingId}
							bookingReference={bookingReference}
							document={doc}
							key={doc.id}
						/>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
