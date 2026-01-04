/**
 * Booking Cancelled by Admin Email Template
 * Sent to the user when an admin cancels their booking
 */

import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

interface BookingCancelledByAdminEmailProps {
	userName: string;
	referenceNumber: string;
	reason?: string;
	dashboardUrl: string;
}

export function BookingCancelledByAdminEmail({
	userName,
	referenceNumber,
	reason,
	dashboardUrl,
}: BookingCancelledByAdminEmailProps) {
	return (
		<BaseLayout preview={`Booking ${referenceNumber} has been cancelled`}>
			<Heading style={heading}>Booking Cancelled</Heading>
			<Text style={paragraph}>Dear {userName},</Text>
			<Text style={paragraph}>
				We regret to inform you that your booking request{" "}
				<strong>{referenceNumber}</strong> has been cancelled by our laboratory
				administrators.
			</Text>
			{reason && (
				<>
					<Text style={labelText}>Cancellation Reason:</Text>
					<Text style={reasonText}>{reason}</Text>
				</>
			)}
			<Text style={paragraph}>
				If you have any questions or concerns about this cancellation, please
				don't hesitate to contact us. We're here to help and may be able to
				provide alternative solutions.
			</Text>
			<Button href={dashboardUrl} style={button}>
				View Dashboard
			</Button>
			<Text style={paragraph}>
				We apologize for any inconvenience this may cause. Thank you for your
				understanding.
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

export default BookingCancelledByAdminEmail;
