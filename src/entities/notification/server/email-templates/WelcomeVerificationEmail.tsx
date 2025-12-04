/**
 * Welcome Verification Email Template
 * Sent to new users to verify their email address
 */

import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

interface WelcomeVerificationEmailProps {
	customerName: string;
	verificationUrl: string;
}

export function WelcomeVerificationEmail({
	customerName,
	verificationUrl,
}: WelcomeVerificationEmailProps) {
	return (
		<BaseLayout preview="Welcome to ChECA Lab - Please verify your email">
			<Heading style={heading}>Welcome to ChECA Lab!</Heading>
			<Text style={paragraph}>Dear {customerName},</Text>
			<Text style={paragraph}>
				Thank you for registering with ChECA Lab. We're excited to have you join
				our laboratory community!
			</Text>
			<Text style={paragraph}>
				To complete your registration and activate your account, please verify
				your email address by clicking the button below:
			</Text>
			<Button href={verificationUrl} style={button}>
				Verify Email Address
			</Button>
			<Text style={noteText}>
				This verification link will expire in 24 hours. If you did not create an
				account with ChECA Lab, you can safely ignore this email.
			</Text>
			<Text style={paragraph}>
				Once your email is verified, your account will be reviewed by our
				administrators. You will receive a notification once your account is
				approved and ready to use.
			</Text>
			<Text style={paragraph}>After approval, you'll be able to:</Text>
			<ul style={list}>
				<li style={listItem}>Book laboratory analysis services</li>
				<li style={listItem}>Reserve workspace time</li>
				<li style={listItem}>Track sample status in real-time</li>
				<li style={listItem}>Access your analysis results</li>
			</ul>
			<Text style={paragraph}>
				If you have any questions, feel free to contact our support team.
			</Text>
			<Text style={paragraph}>
				Welcome aboard!
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
	color: "#1e3a8a",
	marginBottom: "24px",
};

const paragraph = {
	fontSize: "14px",
	lineHeight: "24px",
	color: "#475569",
	margin: "16px 0",
};

const list = {
	margin: "16px 0",
	paddingLeft: "24px",
};

const listItem = {
	fontSize: "14px",
	lineHeight: "24px",
	color: "#475569",
	margin: "8px 0",
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

const noteText = {
	fontSize: "13px",
	lineHeight: "20px",
	color: "#64748b",
	backgroundColor: "#f8fafc",
	padding: "12px 16px",
	borderRadius: "8px",
	margin: "16px 0",
};

export default WelcomeVerificationEmail;
