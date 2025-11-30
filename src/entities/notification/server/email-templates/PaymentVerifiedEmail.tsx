/**
 * Payment Verified Email Template
 */

import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

interface PaymentVerifiedEmailProps {
    customerName: string;
    invoiceNumber: string;
    amount: string;
    paymentDate: string;
    bookingReference: string;
    dashboardUrl: string;
}

export function PaymentVerifiedEmail({
    customerName,
    invoiceNumber,
    amount,
    paymentDate,
    bookingReference,
    dashboardUrl,
}: PaymentVerifiedEmailProps) {
    return (
        <BaseLayout preview={`Payment verified for invoice ${invoiceNumber}`}>
            <Heading style={heading}>Payment Verified</Heading>
            <Text style={paragraph}>Dear {customerName},</Text>
            <Text style={paragraph}>
                Thank you! Your payment has been verified by our finance team.
            </Text>

            <Text style={detailsBox}>
                <strong>Invoice Number:</strong> {invoiceNumber}
                <br />
                <strong>Amount:</strong> {amount}
                <br />
                <strong>Payment Date:</strong> {paymentDate}
                <br />
                <strong>Booking Reference:</strong> {bookingReference}
            </Text>

            <Text style={paragraph}>
                Your analysis results are now available for download. You can access
                them from your dashboard.
            </Text>

            <Button href={dashboardUrl} style={button}>
                Download Results
            </Button>

            <Text style={paragraph}>
                Thank you for using ChECA Lab services. We appreciate your business!
            </Text>
        </BaseLayout>
    );
}

// Styles
const heading = {
    fontSize: "24px",
    fontWeight: "bold" as const,
    color: "#16a34a",
    marginBottom: "24px",
};

const paragraph = {
    fontSize: "14px",
    lineHeight: "24px",
    color: "#475569",
    margin: "16px 0",
};

const detailsBox = {
    fontSize: "14px",
    lineHeight: "28px",
    color: "#1e293b",
    backgroundColor: "#f0fdf4",
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid #bbf7d0",
    margin: "16px 0",
};

const button = {
    backgroundColor: "#16a34a",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "600" as const,
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "12px 24px",
    margin: "24px 0",
};

export default PaymentVerifiedEmail;
