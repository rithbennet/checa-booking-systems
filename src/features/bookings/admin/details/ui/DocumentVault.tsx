"use client";

import {
    Download,
    Eye,
    FileCheck,
    FilePlus,
    FileText,
    Loader2,
    RefreshCw,
    ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { BookingCommandCenterVM } from "@/entities/booking/model/command-center-types";
import {
    useGenerateForms,
    useRegenerateForm,
    useVerifySignature,
} from "@/entities/service-form";
import { BookingDocumentsList } from "@/features/bookings/shared";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { formatDate } from "../lib/helpers";

interface DocumentVaultProps {
    booking: BookingCommandCenterVM;
}

export function DocumentVault({ booking }: DocumentVaultProps) {
    const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
    const generateForms = useGenerateForms();
    const regenerateForm = useRegenerateForm(booking.id);
    const verifySignature = useVerifySignature();

    // Get all documents from service forms
    const serviceForms = booking.serviceForms;
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
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
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
            </div>

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
                            onClick={() => {
                                verifySignature.mutate(formNeedingVerification.id, {
                                    onSuccess: () => {
                                        toast.success("Signature verified successfully", {
                                            description: "The signed forms have been verified and the booking can proceed.",
                                        });
                                    },
                                    onError: (error) => {
                                        toast.error("Failed to verify signature", {
                                            description:
                                                error instanceof Error ? error.message : "Unknown error occurred",
                                        });
                                    },
                                });
                            }}
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


            </div>

            {/* Admin / System Generated Documents */}
            <div className="border-slate-100 border-t bg-slate-50 p-4">
                <p className="mb-2 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                    Admin / System
                </p>
                <div className="space-y-2">
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
                                disabled={regeneratingId === form.id}
                                onClick={() => {
                                    setRegeneratingId(form.id);
                                    regenerateForm.mutate(form.id, {
                                        onSuccess: () => {
                                            setRegeneratingId(null);
                                        },
                                        onError: () => {
                                            setRegeneratingId(null);
                                        },
                                        onSettled: () => {
                                            setRegeneratingId(null);
                                        },
                                    });
                                }}
                                size="sm"
                                variant="outline"
                            >
                                {regeneratingId === form.id ? (
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
