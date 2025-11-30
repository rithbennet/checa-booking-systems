/**
 * Service Form Ready Email Template
 */

import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

interface ServiceFormReadyEmailProps {
    customerName: string;
    formNumber: string;
    bookingReference: string;
    validUntil: string;
    requiresWorkingAreaAgreement: boolean;
    dashboardUrl: string;
}

export function ServiceFormReadyEmail({
    customerName,
    formNumber,
    bookingReference,
    validUntil,
    requiresWorkingAreaAgreement,
    dashboardUrl,
}: ServiceFormReadyEmailProps) {
    return (
        <BaseLayout preview={`Service form ${formNumber} is ready for signing`}>
            <Heading style={heading}>Service Form Ready</Heading>
            <Text style={paragraph}>Dear {customerName},</Text>
            <Text style={paragraph}>
                The service form for your booking has been generated and is ready for
                your signature.
            </Text>

            <Text style={detailsBox}>
                <strong>Form Number:</strong> {formNumber}
                <br />
                <strong>Booking Reference:</strong> {bookingReference}
                <br />
                <strong>Valid Until:</strong> {validUntil}
            </Text>

            <Text style={paragraph}>
                <strong>Next Steps:</strong>
            </Text>
            <ol style={list}>
                <li style={listItem}>Download the service form from your dashboard</li>
                <li style={listItem}>Review and sign the form</li>
                {requiresWorkingAreaAgreement && (
                    <li style={listItem}>
                        Sign the Working Area Agreement form (required for workspace access)
                    </li>
                )}
                <li style={listItem}>
                    Upload the signed document(s) to your dashboard
                </li>
            </ol>

            <Button href={dashboardUrl} style={button}>
                Download Forms
            </Button>

            <Text style={noteText}>
                <strong>Important:</strong> The form is valid until {validUntil}. Please
                submit your signed documents before this date to avoid delays.
            </Text>
        </BaseLayout>
    );
}

// Styles
const heading = {
    fontSize: "24px",
    fontWeight: "bold" as const,
    color: "#0891b2",
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
    backgroundColor: "#ecfeff",
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid #a5f3fc",
    margin: "16px 0",
};

const list = {
    margin: "16px 0",
    paddingLeft: "24px",
};

const listItem = {
    fontSize: "14px",
    lineHeight: "24px",
    color: "#475569",
    margin: "8px 0",
};

const button = {
    backgroundColor: "#0891b2",
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

const noteText = {
    fontSize: "13px",
    lineHeight: "20px",
    color: "#64748b",
    backgroundColor: "#f8fafc",
    padding: "12px 16px",
    borderRadius: "8px",
    margin: "16px 0",
};

export default ServiceFormReadyEmail;
