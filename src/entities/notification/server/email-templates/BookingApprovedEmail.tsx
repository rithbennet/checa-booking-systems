/**
 * Booking Approved Email Template
 */

import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

interface BookingApprovedEmailProps {
	customerName: string;
	referenceNumber: string;
	dashboardUrl: string;
}

export function BookingApprovedEmail({
	customerName,
	referenceNumber,
	dashboardUrl,
}: BookingApprovedEmailProps) {
	return (
		<BaseLayout preview={`Booking ${referenceNumber} has been approved`}>
			<Heading style={heading}>Booking Approved</Heading>
			<Text style={paragraph}>Dear {customerName},</Text>
			<Text style={paragraph}>
				Great news! Your booking request <strong>{referenceNumber}</strong> has
				been approved by our administrators.
			</Text>
			<Text style={paragraph}>
				You can now proceed with the next steps. Please check your dashboard for
				further instructions regarding sample submission or workspace access.
			</Text>
			<Button href={dashboardUrl} style={button}>
				View Booking Details
			</Button>
			<Text style={paragraph}>
				Thank you for choosing ChECA Lab. We look forward to serving you!
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

export default BookingApprovedEmail;
