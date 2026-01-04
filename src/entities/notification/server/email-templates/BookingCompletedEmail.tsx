/**
 * Booking Completed Email Template
 * Sent when all samples in a booking have reached terminal states
 */

import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

interface BookingCompletedEmailProps {
	customerName: string;
	bookingReference: string;
	dashboardUrl: string;
}

export function BookingCompletedEmail({
	customerName,
	bookingReference,
	dashboardUrl,
}: BookingCompletedEmailProps) {
	return (
		<BaseLayout
			preview={`Booking ${bookingReference} completed - All results ready`}
		>
			<Heading style={heading}>Booking Completed</Heading>
			<Text style={paragraph}>Dear {customerName},</Text>
			<Text style={paragraph}>
				Great news! All results for your booking are now ready.
			</Text>

			<Text style={detailsBox}>
				<strong>Booking Reference:</strong> {bookingReference}
				<br />
				<strong>Status:</strong> Completed ✓
			</Text>

			<Text style={paragraph}>
				You can now view and download all your analysis results from the
				dashboard. Please ensure your payment is verified to access the results.
			</Text>

			<Button href={dashboardUrl} style={button}>
				View Results
			</Button>

			<Text style={paragraph}>
				Thank you for choosing ChECA Lab for your analytical needs. We hope to
				serve you again!
			</Text>

			<Text style={footerText}>
				If you have any questions about your results, please don't hesitate to
				contact our team.
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

const footerText = {
	fontSize: "12px",
	lineHeight: "20px",
	color: "#94a3b8",
	margin: "24px 0 0 0",
};

export default BookingCompletedEmail;
