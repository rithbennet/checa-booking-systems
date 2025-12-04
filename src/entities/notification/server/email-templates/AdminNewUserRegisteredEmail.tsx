/**
 * Admin New User Pending Email Template
 * Sent to admins when a new user registers and needs verification
 */

import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

interface AdminNewUserRegisteredEmailProps {
	adminName: string;
	customerName: string;
	customerEmail: string;
	userType: string;
	adminDashboardUrl: string;
}

export function AdminNewUserRegisteredEmail({
	adminName,
	customerName,
	customerEmail,
	userType,
	adminDashboardUrl,
}: AdminNewUserRegisteredEmailProps) {
	return (
		<BaseLayout preview={`New User Registered: ${customerName}`}>
			<Heading style={heading}>New User Registration</Heading>
			<Text style={paragraph}>Dear {adminName},</Text>
			<Text style={paragraph}>
				A new user has completed email verification and is awaiting account
				approval.
			</Text>

			<Text style={detailsBox}>
				<strong>Name:</strong> {customerName}
				<br />
				<strong>Email:</strong> {customerEmail}
				<br />
				<strong>User Type:</strong> {userType}
			</Text>

			<Text style={paragraph}>
				Please review this user's information and approve or reject their
				account in the admin dashboard.
			</Text>

			<Button href={adminDashboardUrl} style={button}>
				Review User Account
			</Button>

			<Text style={noteText}>
				This is an automated notification from the ChECA Lab booking system.
			</Text>
		</BaseLayout>
	);
}

// Styles
const heading = {
	fontSize: "24px",
	fontWeight: "bold" as const,
	color: "#7c3aed",
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
	backgroundColor: "#faf5ff",
	padding: "16px",
	borderRadius: "8px",
	border: "1px solid #e9d5ff",
	margin: "16px 0",
};

const button = {
	backgroundColor: "#7c3aed",
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

export default AdminNewUserRegisteredEmail;
