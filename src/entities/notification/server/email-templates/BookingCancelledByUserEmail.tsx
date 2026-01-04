/**
 * Booking Cancelled by User Email Template
 * Sent to the user confirming their cancellation
 */

import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

interface BookingCancelledByUserEmailProps {
	userName: string;
	referenceNumber: string;
	reason?: string;
	dashboardUrl: string;
}

export function BookingCancelledByUserEmail({
	userName,
	referenceNumber,
	reason,
	dashboardUrl,
}: BookingCancelledByUserEmailProps) {
	return (
		<BaseLayout preview={`Booking ${referenceNumber} has been cancelled`}>
			<Heading style={heading}>Booking Cancelled</Heading>
			<Text style={paragraph}>Dear {userName},</Text>
			<Text style={paragraph}>
				Your booking request <strong>{referenceNumber}</strong> has been
				successfully cancelled as per your request.
			</Text>
			{reason && (
				<>
					<Text style={labelText}>Cancellation Reason:</Text>
					<Text style={reasonText}>{reason}</Text>
				</>
			)}
			<Text style={paragraph}>
				If you cancelled this booking by mistake or have any questions, please
				contact our laboratory administrators immediately.
			</Text>
			<Button href={dashboardUrl} style={button}>
				View Dashboard
			</Button>
			<Text style={paragraph}>
				Thank you for informing us. We hope to serve you again in the future.
			</Text>
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

const labelText = {
	fontSize: "12px",
	fontWeight: "600" as const,
	color: "#64748b",
	textTransform: "uppercase" as const,
	letterSpacing: "0.5px",
	marginBottom: "4px",
};

const reasonText = {
	fontSize: "14px",
	lineHeight: "20px",
	color: "#334155",
	backgroundColor: "#f8fafc",
	padding: "12px",
	borderRadius: "6px",
	borderLeft: "3px solid #dc2626",
	margin: "8px 0 16px 0",
};

const button = {
	backgroundColor: "#0f172a",
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

export default BookingCancelledByUserEmail;
