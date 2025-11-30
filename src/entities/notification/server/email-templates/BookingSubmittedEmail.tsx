/**
 * Booking Submitted Email Template
 */

import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

interface BookingSubmittedEmailProps {
	customerName: string;
	referenceNumber: string;
	status: "pending_approval" | "pending_user_verification";
	dashboardUrl: string;
}

export function BookingSubmittedEmail({
	customerName,
	referenceNumber,
	status,
	dashboardUrl,
}: BookingSubmittedEmailProps) {
	const statusMessage =
		status === "pending_approval"
			? "Your booking is now pending admin approval. We will review it shortly and notify you of any updates."
			: "Your booking is pending account verification. Once your account is verified, it will be reviewed by our administrators.";

	return (
		<BaseLayout preview={`Booking ${referenceNumber} submitted successfully`}>
			<Heading style={heading}>Booking Submitted</Heading>
			<Text style={paragraph}>Dear {customerName},</Text>
			<Text style={paragraph}>
				Thank you for submitting your booking request. Your booking reference
				number is:
			</Text>
			<Text style={referenceStyle}>{referenceNumber}</Text>
			<Text style={paragraph}>{statusMessage}</Text>
			<Button href={dashboardUrl} style={button}>
				View Booking Details
			</Button>
			<Text style={paragraph}>
				If you have any questions, please don't hesitate to contact us.
			</Text>
		</BaseLayout>
	);
}

// Styles
const heading = {
	fontSize: "24px",
	fontWeight: "bold" as const,
	color: "#1e293b",
	marginBottom: "24px",
};

const paragraph = {
	fontSize: "14px",
	lineHeight: "24px",
	color: "#475569",
	margin: "16px 0",
};

const referenceStyle = {
	fontSize: "20px",
	fontWeight: "bold" as const,
	color: "#1e3a8a",
	backgroundColor: "#f1f5f9",
	padding: "12px 24px",
	borderRadius: "8px",
	textAlign: "center" as const,
	margin: "24px 0",
};

const button = {
	backgroundColor: "#1e3a8a",
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

export default BookingSubmittedEmail;
