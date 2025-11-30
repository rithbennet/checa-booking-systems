/**
 * Booking Rejected Email Template
 */

import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

interface BookingRejectedEmailProps {
	customerName: string;
	referenceNumber: string;
	reason: string;
	dashboardUrl: string;
}

export function BookingRejectedEmail({
	customerName,
	referenceNumber,
	reason,
	dashboardUrl,
}: BookingRejectedEmailProps) {
	return (
		<BaseLayout preview={`Booking ${referenceNumber} has been rejected`}>
			<Heading style={heading}>Booking Rejected</Heading>
			<Text style={paragraph}>Dear {customerName},</Text>
			<Text style={paragraph}>
				We regret to inform you that your booking request{" "}
				<strong>{referenceNumber}</strong> has been rejected.
			</Text>
			<Text style={paragraph}>
				<strong>Reason:</strong>
			</Text>
			<Text style={reasonBox}>{reason}</Text>
			<Text style={paragraph}>
				If you have questions about this decision or would like to discuss
				alternative options, please contact our team.
			</Text>
			<Button href={dashboardUrl} style={button}>
				View Booking Details
			</Button>
		</BaseLayout>
	);
}

// Styles
const heading = {
	fontSize: "24px",
	fontWeight: "bold" as const,
	color: "#dc2626",
	marginBottom: "24px",
};

const paragraph = {
	fontSize: "14px",
	lineHeight: "24px",
	color: "#475569",
	margin: "16px 0",
};

const reasonBox = {
	fontSize: "14px",
	lineHeight: "22px",
	color: "#b91c1c",
	backgroundColor: "#fef2f2",
	padding: "16px",
	borderRadius: "8px",
	borderLeft: "4px solid #dc2626",
	margin: "16px 0",
};

const button = {
	backgroundColor: "#64748b",
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

export default BookingRejectedEmail;
