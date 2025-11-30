/**
 * Booking Revision Requested Email Template
 */

import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

interface BookingRevisionRequestedEmailProps {
	customerName: string;
	referenceNumber: string;
	adminNotes: string;
	editUrl: string;
}

export function BookingRevisionRequestedEmail({
	customerName,
	referenceNumber,
	adminNotes,
	editUrl,
}: BookingRevisionRequestedEmailProps) {
	return (
		<BaseLayout preview={`Booking ${referenceNumber} requires revision`}>
			<Heading style={heading}>Revision Requested</Heading>
			<Text style={paragraph}>Dear {customerName},</Text>
			<Text style={paragraph}>
				Your booking request <strong>{referenceNumber}</strong> requires some
				modifications before it can be approved.
			</Text>
			<Text style={paragraph}>
				<strong>Admin Notes:</strong>
			</Text>
			<Text style={notesBox}>{adminNotes}</Text>
			<Text style={paragraph}>
				Please review the notes above and update your booking accordingly. Once
				you've made the necessary changes, resubmit your booking for review.
			</Text>
			<Button href={editUrl} style={button}>
				Edit Booking
			</Button>
		</BaseLayout>
	);
}

// Styles
const heading = {
	fontSize: "24px",
	fontWeight: "bold" as const,
	color: "#d97706",
	marginBottom: "24px",
};

const paragraph = {
	fontSize: "14px",
	lineHeight: "24px",
	color: "#475569",
	margin: "16px 0",
};

const notesBox = {
	fontSize: "14px",
	lineHeight: "22px",
	color: "#92400e",
	backgroundColor: "#fffbeb",
	padding: "16px",
	borderRadius: "8px",
	borderLeft: "4px solid #d97706",
	margin: "16px 0",
};

const button = {
	backgroundColor: "#d97706",
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

export default BookingRevisionRequestedEmail;
