"use client";

import {
    Calendar,
    CheckCircle2,
    Download,
    Eye,
    FileText,
    Loader2,
    User,
    XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/shadcn/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/ui/shadcn/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/shadcn/select";
import { Textarea } from "@/shared/ui/shadcn/textarea";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { useRejectDocument, useVerifyDocument } from "../api";
import type { BookingDocumentVM } from "../model";
import { formatFileSize, getDocumentTypeLabel } from "../model";
import { VerificationStatusBadge } from "./VerificationStatusBadge";

export interface DocumentVerificationCardProps {
    document: BookingDocumentVM;
    // Reserved for future use (e.g., booking-level validation or context)
    bookingId?: string;
    bookingReference: string;
    onVerified?: () => void;
    onRejected?: () => void;
}

export function DocumentVerificationCard({
    document,
    bookingReference,
    onVerified,
    onRejected,
}: DocumentVerificationCardProps) {
    const [showVerifyDialog, setShowVerifyDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [verifyNotes, setVerifyNotes] = useState("");
    const [rejectReason, setRejectReason] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<string>("eft");
    const [paymentAmount, setPaymentAmount] = useState<string>("");
    const [isDownloading, setIsDownloading] = useState(false);

    const verifyMutation = useVerifyDocument();
    const rejectMutation = useRejectDocument();

    const isPaymentReceipt = document.type === "payment_receipt";
    const isPending = document.verificationStatus === "pending_verification";

    const handleVerify = async () => {
        try {
            await verifyMutation.mutateAsync({
                documentId: document.id,
                notes: verifyNotes || undefined,
                ...(isPaymentReceipt && {
                    paymentMethod,
                    amount: paymentAmount || undefined,
                }),
            });
            toast.success(
                `${getDocumentTypeLabel(document.type)} verified successfully`,
            );
            setShowVerifyDialog(false);
            setVerifyNotes("");
            onVerified?.();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Failed to verify document",
            );
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.error("Please provide a rejection reason");
            return;
        }
        try {
            await rejectMutation.mutateAsync({
                documentId: document.id,
                reason: rejectReason,
            });
            toast.success(`${getDocumentTypeLabel(document.type)} rejected`);
            setShowRejectDialog(false);
            setRejectReason("");
            onRejected?.();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Failed to reject document",
            );
        }
    };

    const handlePreview = () => {
        window.open(document.blob.url, "_blank");
    };

    const handleDownload = async () => {
        let link: HTMLAnchorElement | null = null;
        try {
            setIsDownloading(true);
            link = window.document.createElement("a");
            link.href = document.blob.url;
            link.download = document.blob.fileName;
            window.document.body.appendChild(link);
            link.click();
            toast.success("Download started", {
                description: document.blob.fileName,
            });
        } catch (error) {
            console.error("Download failed:", error);
            toast.error("Failed to download file", {
                description:
                    error instanceof Error
                        ? error.message
                        : "Please check your connection and try again.",
            });
        } finally {
            if (link && window.document.body.contains(link)) {
                window.document.body.removeChild(link);
            }
            setIsDownloading(false);
        }
    };

    return (
        <>
            <Card
                className={cn(
                    "transition-all",
                    isPending && "border-amber-200 bg-amber-50/50",
                    document.verificationStatus === "verified" &&
                    "border-green-200 bg-green-50/50",
                    document.verificationStatus === "rejected" &&
                    "border-red-200 bg-red-50/50",
                )}
            >
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileText className="h-4 w-4 text-slate-500" />
                                {getDocumentTypeLabel(document.type)}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Booking: {bookingReference}
                            </CardDescription>
                        </div>
                        <VerificationStatusBadge status={document.verificationStatus} />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* File Info */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="truncate font-medium text-sm">
                            {document.blob.fileName}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-muted-foreground text-xs">
                            <span>{formatFileSize(document.blob.sizeBytes)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(document.createdAt).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {document.createdBy.firstName} {document.createdBy.lastName}
                            </span>
                        </div>
                    </div>

                    {/* Rejection reason if rejected */}
                    {document.verificationStatus === "rejected" &&
                        document.rejectionReason && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                                <p className="font-medium text-red-800 text-xs">
                                    Rejection Reason:
                                </p>
                                <p className="mt-1 text-red-700 text-sm">
                                    {document.rejectionReason}
                                </p>
                            </div>
                        )}

                    {/* Verification info if verified */}
                    {document.verificationStatus === "verified" &&
                        document.verifiedBy && (
                            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                                <p className="font-medium text-green-800 text-xs">
                                    Verified by {document.verifiedBy.firstName}{" "}
                                    {document.verifiedBy.lastName}
                                </p>
                                {document.verifiedAt && (
                                    <p className="mt-1 text-green-700 text-xs">
                                        {new Date(document.verifiedAt).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button onClick={handlePreview} size="sm" variant="outline">
                                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                                    Preview
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Open in new tab</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    disabled={isDownloading}
                                    onClick={handleDownload}
                                    size="sm"
                                    variant="outline"
                                >
                                    {isDownloading ? (
                                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Download className="mr-1.5 h-3.5 w-3.5" />
                                    )}
                                    Download
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download file</TooltipContent>
                        </Tooltip>

                        {isPending && (
                            <>
                                <div className="flex-1" />
                                <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => setShowVerifyDialog(true)}
                                    size="sm"
                                >
                                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                    Verify
                                </Button>
                                <Button
                                    onClick={() => setShowRejectDialog(true)}
                                    size="sm"
                                    variant="destructive"
                                >
                                    <XCircle className="mr-1.5 h-3.5 w-3.5" />
                                    Reject
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Verify Dialog */}
            <Dialog onOpenChange={setShowVerifyDialog} open={showVerifyDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Verify {getDocumentTypeLabel(document.type)}
                        </DialogTitle>
                        <DialogDescription>
                            Confirm verification of this document. This action will notify the
                            user.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {isPaymentReceipt && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="paymentMethod">Payment Method</Label>
                                    <Select
                                        onValueChange={setPaymentMethod}
                                        value={paymentMethod}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select payment method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="eft">
                                                EFT (Electronic Funds Transfer)
                                            </SelectItem>
                                            <SelectItem value="vote_transfer">
                                                Vote Transfer
                                            </SelectItem>
                                            <SelectItem value="local_order">Local Order</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="paymentAmount">
                                        Payment Amount (optional)
                                    </Label>
                                    <Input
                                        id="paymentAmount"
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        placeholder="Leave blank to use booking total"
                                        type="number"
                                        value={paymentAmount}
                                    />
                                </div>
                            </>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (optional)</Label>
                            <Textarea
                                id="notes"
                                onChange={(e) => setVerifyNotes(e.target.value)}
                                placeholder="Add any notes about this verification..."
                                value={verifyNotes}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => setShowVerifyDialog(false)}
                            variant="outline"
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            disabled={verifyMutation.isPending}
                            onClick={handleVerify}
                        >
                            {verifyMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}
                            Verify Document
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog onOpenChange={setShowRejectDialog} open={showRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Reject {getDocumentTypeLabel(document.type)}
                        </DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejection. The user will be notified
                            and asked to re-upload.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">
                                Rejection Reason <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="reason"
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="e.g., Signature is illegible, document is incomplete..."
                                required
                                value={rejectReason}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => setShowRejectDialog(false)}
                            variant="outline"
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={!rejectReason.trim() || rejectMutation.isPending}
                            onClick={handleReject}
                            variant="destructive"
                        >
                            {rejectMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <XCircle className="mr-2 h-4 w-4" />
                            )}
                            Reject Document
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
