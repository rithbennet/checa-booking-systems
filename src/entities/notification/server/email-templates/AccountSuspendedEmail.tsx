/**
 * Account Suspended Email Template
 * Sent to users when their account is suspended or disabled by admin
 */

import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

interface AccountSuspendedEmailProps {
	customerName: string;
	reason?: string;
	contactEmail: string;
	status: "suspended" | "inactive";
}

export function AccountSuspendedEmail({
	customerName,
	reason,
	contactEmail,
	status,
}: AccountSuspendedEmailProps) {
	const isSuspended = status === "suspended";
	const statusTitle = isSuspended ? "Account Suspended" : "Account Deactivated";
	const statusDescription = isSuspended
		? "Your ChECA Lab account has been temporarily suspended."
		: "Your ChECA Lab account has been deactivated.";

	return (
		<BaseLayout preview={`Your ChECA Lab account has been ${status}`}>
			<Heading style={heading}>{statusTitle}</Heading>
			<Text style={paragraph}>Dear {customerName},</Text>
			<Text style={paragraph}>{statusDescription}</Text>

			{reason && (
				<Text style={reasonBox}>
					<strong>Reason:</strong> {reason}
				</Text>
			)}

			<Text style={paragraph}>
				During this time, you will not be able to access your account or make
				new bookings. Any pending bookings may be affected.
			</Text>

			<Text style={paragraph}>
				If you have questions about this action or would like to discuss
				reinstatement, please contact our support team.
			</Text>

			<Button href={`mailto:${contactEmail}`} style={button}>
				Contact Support
			</Button>

			<Text style={noteText}>Support Email: {contactEmail}</Text>

			<Text style={paragraph}>
				We appreciate your understanding.
				<br />
				The ChECA Lab Team
			</Text>
		</BaseLayout>
	);
}

// Styles
const heading = {
	fontSize: "24px",
	fontWeight: "bold" as const,
	color: "#ea580c",
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
	color: "#9a3412",
	backgroundColor: "#fff7ed",
	padding: "16px",
	borderRadius: "8px",
	border: "1px solid #fed7aa",
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

export default AccountSuspendedEmail;
