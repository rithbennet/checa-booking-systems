/**
 * Sample Status Update Email Template
 */

import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

type SampleStatus =
    | "received"
    | "in_analysis"
    | "analysis_complete"
    | "return_requested"
    | "returned";

interface SampleStatusUpdateEmailProps {
    customerName: string;
    sampleIdentifier: string;
    serviceName: string;
    status: SampleStatus;
    bookingReference: string;
    notes?: string;
    dashboardUrl: string;
}

const statusConfig: Record<
    SampleStatus,
    { title: string; description: string; color: string }
> = {
    received: {
        title: "Sample Received",
        description:
            "Your sample has been received at our laboratory and logged into our system.",
        color: "#2563eb",
    },
    in_analysis: {
        title: "Analysis In Progress",
        description:
            "Your sample is now being analyzed by our laboratory technicians.",
        color: "#7c3aed",
    },
    analysis_complete: {
        title: "Analysis Complete",
        description:
            "The analysis of your sample has been completed. Results will be available once payment is verified.",
        color: "#16a34a",
    },
    return_requested: {
        title: "Return Requested",
        description:
            "Your request to return the sample has been noted. Please contact us to arrange pickup.",
        color: "#d97706",
    },
    returned: {
        title: "Sample Returned",
        description: "Your sample has been successfully returned.",
        color: "#64748b",
    },
};

export function SampleStatusUpdateEmail({
    customerName,
    sampleIdentifier,
    serviceName,
    status,
    bookingReference,
    notes,
    dashboardUrl,
}: SampleStatusUpdateEmailProps) {
    const config = statusConfig[status];

    return (
        <BaseLayout preview={`Sample ${sampleIdentifier}: ${config.title}`}>
            <Heading style={{ ...heading, color: config.color }}>
                {config.title}
            </Heading>
            <Text style={paragraph}>Dear {customerName},</Text>
            <Text style={paragraph}>{config.description}</Text>

            <Text style={detailsBox}>
                <strong>Sample ID:</strong> {sampleIdentifier}
                <br />
                <strong>Service:</strong> {serviceName}
                <br />
                <strong>Booking Reference:</strong> {bookingReference}
            </Text>

            {notes && (
                <>
                    <Text style={paragraph}>
                        <strong>Notes:</strong>
                    </Text>
                    <Text style={notesBox}>{notes}</Text>
                </>
            )}

            <Button
                href={dashboardUrl}
                style={{ ...button, backgroundColor: config.color }}
            >
                Track Your Samples
            </Button>
        </BaseLayout>
    );
}

// Styles
const heading = {
    fontSize: "24px",
    fontWeight: "bold" as const,
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
    backgroundColor: "#f8fafc",
    padding: "16px",
    borderRadius: "8px",
    margin: "16px 0",
};

const notesBox = {
    fontSize: "14px",
    lineHeight: "22px",
    color: "#475569",
    backgroundColor: "#f1f5f9",
    padding: "16px",
    borderRadius: "8px",
    fontStyle: "italic" as const,
    margin: "16px 0",
};

const button = {
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

export default SampleStatusUpdateEmail;
