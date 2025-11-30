/**
 * Account Verified Email Template
 */

import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

interface AccountVerifiedEmailProps {
	customerName: string;
	dashboardUrl: string;
}

export function AccountVerifiedEmail({
	customerName,
	dashboardUrl,
}: AccountVerifiedEmailProps) {
	return (
		<BaseLayout preview="Your ChECA Lab account has been verified">
			<Heading style={heading}>Account Verified</Heading>
			<Text style={paragraph}>Dear {customerName},</Text>
			<Text style={paragraph}>
				Congratulations! Your ChECA Lab account has been successfully verified
				by our administrators.
			</Text>
			<Text style={paragraph}>
				You now have full access to our laboratory services. Any pending
				bookings you may have submitted will now be reviewed by our team.
			</Text>
			<Text style={paragraph}>What you can do now:</Text>
			<ul style={list}>
				<li style={listItem}>Browse and book laboratory analysis services</li>
				<li style={listItem}>Reserve workspace time in our facilities</li>
				<li style={listItem}>Track your sample status in real-time</li>
				<li style={listItem}>Access your results once payment is verified</li>
			</ul>
			<Button href={dashboardUrl} style={button}>
				Go to Dashboard
			</Button>
			<Text style={paragraph}>
				Welcome to ChECA Lab. We're excited to support your research!
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

export default AccountVerifiedEmail;
