/**
 * Account Rejected Email Template
 * Sent to users when their account is rejected by admin
 */

import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

interface AccountRejectedEmailProps {
	customerName: string;
	reason?: string;
	contactEmail: string;
}

export function AccountRejectedEmail({
	customerName,
	reason,
	contactEmail,
}: AccountRejectedEmailProps) {
	return (
		<BaseLayout preview="Your ChECA Lab account registration was not approved">
			<Heading style={heading}>Account Not Approved</Heading>
			<Text style={paragraph}>Dear {customerName},</Text>
			<Text style={paragraph}>
				We regret to inform you that your ChECA Lab account registration has not
				been approved at this time.
			</Text>

			{reason && (
				<Text style={reasonBox}>
					<strong>Reason:</strong> {reason}
				</Text>
			)}

			<Text style={paragraph}>
				If you believe this decision was made in error, or if you would like
				more information about the reason for this decision, please don't
				hesitate to contact our support team.
			</Text>

			<Text style={paragraph}>
				You may also re-apply with updated information if applicable.
			</Text>

			<Button href={`mailto:${contactEmail}`} style={button}>
				Contact Support
			</Button>

			<Text style={noteText}>Support Email: {contactEmail}</Text>

			<Text style={paragraph}>
				We appreciate your interest in ChECA Lab and hope to assist you in the
				future.
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

const reasonBox = {
	fontSize: "14px",
	lineHeight: "24px",
	color: "#991b1b",
	backgroundColor: "#fef2f2",
	padding: "16px",
	borderRadius: "8px",
	border: "1px solid #fecaca",
	margin: "16px 0",
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

export default AccountRejectedEmail;
