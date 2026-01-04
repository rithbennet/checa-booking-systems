/**
 * Admin Notification - User Cancelled Booking
 * Sent to lab administrators when a user cancels their booking
 */

import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

interface BookingCancelledNotificationToAdminsEmailProps {
	referenceNumber: string;
	userName: string;
	userEmail: string;
	reason?: string;
	bookingUrl: string;
}

export function BookingCancelledNotificationToAdminsEmail({
	referenceNumber,
	userName,
	userEmail,
	reason,
	bookingUrl,
}: BookingCancelledNotificationToAdminsEmailProps) {
	return (
		<BaseLayout
			preview={`User ${userName} cancelled booking ${referenceNumber}`}
		>
			<Heading style={heading}>User Cancelled Booking</Heading>
			<Text style={paragraph}>
				A user has cancelled their booking request in the ChECA Lab system.
			</Text>

			<Section style={infoBox}>
				<Text style={infoLabel}>Booking Reference:</Text>
				<Text style={infoValue}>{referenceNumber}</Text>

				<Text style={infoLabel}>User:</Text>
				<Text style={infoValue}>
					{userName} ({userEmail})
				</Text>

				{reason && (
					<>
						<Text style={infoLabel}>Cancellation Reason:</Text>
						<Text style={reasonText}>{reason}</Text>
					</>
				)}
			</Section>

			<Button href={bookingUrl} style={button}>
				View Booking Details
			</Button>

			<Hr style={hr} />

			<Text style={footerText}>
				This is an automated notification from the ChECA Lab booking system.
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

const infoBox = {
	backgroundColor: "#f8fafc",
	borderRadius: "8px",
	padding: "20px",
	margin: "24px 0",
	border: "1px solid #e2e8f0",
};

const infoLabel = {
	fontSize: "12px",
	fontWeight: "600" as const,
	color: "#64748b",
	textTransform: "uppercase" as const,
	letterSpacing: "0.5px",
	marginTop: "12px",
	marginBottom: "4px",
};

const infoValue = {
	fontSize: "14px",
	color: "#0f172a",
	marginTop: "0",
	marginBottom: "0",
};

const reasonText = {
	fontSize: "14px",
	lineHeight: "20px",
	color: "#334155",
	backgroundColor: "#ffffff",
	padding: "12px",
	borderRadius: "6px",
	borderLeft: "3px solid #dc2626",
	marginTop: "4px",
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

const hr = {
	borderColor: "#e2e8f0",
	margin: "32px 0",
};

const footerText = {
	fontSize: "12px",
	color: "#94a3b8",
	margin: "8px 0",
};

export default BookingCancelledNotificationToAdminsEmail;
