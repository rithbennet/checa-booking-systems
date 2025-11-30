"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { bookingKeys } from "@/entities/booking/api/query-keys";
import type { UserFinancialVM } from "@/entities/booking/server/user-financials-repository";
import { Button } from "@/shared/ui/shadcn/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { submitPaymentProof } from "../actions/submit-payment-proof";
import { formatAmount } from "../lib/helpers";

interface FinancialsRowActionsProps {
    invoice: UserFinancialVM;
}

export function FinancialsRowActions({ invoice }: FinancialsRowActionsProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<string>("eft");
    const formRef = useRef<HTMLFormElement>(null);
    const queryClient = useQueryClient();

    const canUploadPayment =
        invoice.paymentStatus === "unpaid" || invoice.paymentStatus === "rejected";

    const handleViewInvoice = () => {
        // Open the invoice file in a new tab
        window.open(invoice.invoiceFilePath, "_blank");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const formData = new FormData(e.currentTarget);
            formData.set("invoiceId", invoice.id);
            formData.set("paymentMethod", paymentMethod);
            formData.set("amount", invoice.amount);

            const result = await submitPaymentProof(formData);

            if (result.success) {
                setIsDialogOpen(false);
                // Invalidate the financials query to refresh the table
                queryClient.invalidateQueries({
                    queryKey: bookingKeys.userFinancials(),
                });
            } else {
                setError(result.error ?? "Failed to upload payment proof");
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
            console.error("Payment upload error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex justify-end gap-2">
            <Button onClick={handleViewInvoice} size="sm" variant="outline">
                <ExternalLink className="mr-1 size-4" />
                Invoice
            </Button>

            {canUploadPayment && (
                <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="default">
                            <Upload className="mr-1 size-4" />
                            Pay
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Upload Payment Proof</DialogTitle>
                            <DialogDescription className="space-y-3 pt-2">
                                <p>
                                    Please transfer{" "}
                                    <strong>{formatAmount(invoice.amount)}</strong> to the account
                                    below:
                                </p>
                                <div className="rounded-md bg-muted p-3 text-sm">
                                    <p>
                                        <strong>Bank:</strong> CIMB Bank Berhad
                                    </p>
                                    <p>
                                        <strong>Account Name:</strong> Bendahari UTM
                                    </p>
                                    <p>
                                        <strong>Account No:</strong> 8603410756
                                    </p>
                                    <p>
                                        <strong>Reference:</strong> {invoice.invoiceNumber}
                                    </p>
                                </div>
                                <p className="text-muted-foreground text-xs">
                                    After completing the transfer, upload the receipt/proof of
                                    payment below.
                                </p>
                            </DialogDescription>
                        </DialogHeader>

                        <form className="space-y-4" onSubmit={handleSubmit} ref={formRef}>
                            <div className="space-y-2">
                                <Label htmlFor="paymentMethod">Payment Method</Label>
                                <Select onValueChange={setPaymentMethod} value={paymentMethod}>
                                    <SelectTrigger id="paymentMethod">
                                        <SelectValue placeholder="Select payment method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="eft">EFT / Bank Transfer</SelectItem>
                                        <SelectItem value="vote_transfer">Vote Transfer</SelectItem>
                                        <SelectItem value="local_order">Local Order</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="paymentDate">Payment Date</Label>
                                <Input
                                    id="paymentDate"
                                    max={new Date().toISOString().split("T")[0]}
                                    name="paymentDate"
                                    required
                                    type="date"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="referenceNumber">
                                    Reference/Transaction Number
                                </Label>
                                <Input
                                    id="referenceNumber"
                                    name="referenceNumber"
                                    placeholder="e.g., TRX123456789"
                                    type="text"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="file">Payment Receipt</Label>
                                <Input
                                    accept="image/*,.pdf"
                                    id="file"
                                    name="file"
                                    required
                                    type="file"
                                />
                                <p className="text-muted-foreground text-xs">
                                    Accepted formats: Images (PNG, JPG) or PDF. Max size: 5MB.
                                </p>
                            </div>

                            {error && (
                                <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
                                    {error}
                                </div>
                            )}

                            {invoice.paymentStatus === "rejected" &&
                                invoice.latestPaymentRejectionReason && (
                                    <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                                        <strong>Previous rejection reason:</strong>{" "}
                                        {invoice.latestPaymentRejectionReason}
                                    </div>
                                )}

                            <DialogFooter>
                                <Button
                                    disabled={isSubmitting}
                                    onClick={() => setIsDialogOpen(false)}
                                    type="button"
                                    variant="outline"
                                >
                                    Cancel
                                </Button>
                                <Button disabled={isSubmitting} type="submit">
                                    {isSubmitting ? "Uploading..." : "Submit Payment"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
