"use client";

import { CheckCircle, Lock } from "lucide-react";
import { useState } from "react";
import type { BookingCommandCenterVM } from "@/entities/booking/model/command-center-types";
import {
    useBookingDocuments,
    useRejectPayment,
    useVerifyPayment,
} from "@/entities/booking-document";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import { Skeleton } from "@/shared/ui/shadcn/skeleton";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { formatCurrency } from "../lib/helpers";
import { PaymentVerificationDialog } from "./PaymentVerificationDialog";
import { ServiceItemsList } from "./ServiceItemsList";

interface FinancialGateProps {
    booking: BookingCommandCenterVM;
}

export function FinancialGate({ booking }: FinancialGateProps) {
    const [servicesOpen, setServicesOpen] = useState(false);
    const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
    const [verificationNotes, setVerificationNotes] = useState("");

    // All hooks must be called at the top level
    const {
        data: documents,
        isLoading: documentsLoading,
        error: documentsError,
    } = useBookingDocuments(booking.id);
    const verifyPayment = useVerifyPayment();
    const rejectPayment = useRejectPayment();

    // Return loading state
    if (documentsLoading) {
        return (
            <div className="relative overflow-hidden rounded-xl border-2 border-orange-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-slate-100 border-b p-5">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-7 w-24" />
                </div>
                <div className="border-slate-100 border-b p-5">
                    <Skeleton className="h-8 w-full" />
                </div>
                <div className="space-y-4 p-5">
                    <div className="flex items-end justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-8 w-32" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        );
    }

    // Return error state
    if (documentsError || !documents) {
        return (
            <div className="overflow-hidden rounded-xl border-2 border-red-200 bg-white shadow-sm">
                <div className="p-4">
                    <p className="text-center text-red-600 text-sm">
                        Failed to load payment documents
                    </p>
                </div>
            </div>
        );
    }

    const pendingPaymentDocs =
        documents.filter(
            (doc) =>
                doc.type === "payment_receipt" &&
                doc.verificationStatus === "pending_verification",
        );

    // Financial data from booking
    const totalAmount = Number.parseFloat(booking.totalAmount);
    const isPaid = booking.isPaid;
    const hasUnverifiedPayments = booking.hasUnverifiedPayments;

    const handleVerify = (documentId: string) => {
        verifyPayment.mutate(
            {
                documentId,
                bookingId: booking.id,
                notes: verificationNotes,
            },
            {
                onSuccess: () => {
                    setVerificationNotes("");
                    setVerificationDialogOpen(false);
                },
            },
        );
    };

    const handleReject = (documentId: string) => {
        rejectPayment.mutate(
            {
                documentId,
                bookingId: booking.id,
                notes: verificationNotes,
            },
            {
                onSuccess: () => {
                    setVerificationNotes("");
                    setVerificationDialogOpen(false);
                },
            },
        );
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
            <ServiceItemsList
                booking={booking}
                isOpen={servicesOpen}
                onOpenChange={setServicesOpen}
            />

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
            <PaymentVerificationDialog
                isRejecting={rejectPayment.isPending}
                isVerifying={verifyPayment.isPending}
                onNotesChange={setVerificationNotes}
                onOpenChange={setVerificationDialogOpen}
                onReject={handleReject}
                onVerify={handleVerify}
                open={verificationDialogOpen}
                pendingPaymentDocs={pendingPaymentDocs}
                verificationNotes={verificationNotes}
            />
        </div>
    );
}
