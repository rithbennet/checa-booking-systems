/**
 * Organization Deleted Email Template
 * Sent when an admin deletes an organization (faculty/department/ikohza/company/branch)
 * that the user is associated with
 */

import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

interface OrganizationDeletedEmailProps {
	userName: string;
	organizationType: "faculty" | "department" | "ikohza" | "company" | "branch";
	dashboardUrl: string;
}

const organizationLabels: Record<string, string> = {
	faculty: "Faculty",
	department: "Department",
	ikohza: "Ikohza",
	company: "Company",
	branch: "Company Branch",
};

export function OrganizationDeletedEmail({
	userName,
	organizationType,
	dashboardUrl,
}: OrganizationDeletedEmailProps) {
	const orgLabel = organizationLabels[organizationType] || organizationType;

	return (
		<BaseLayout preview={`Your ${orgLabel} has been removed from ChECA Lab`}>
			<Heading style={heading}>Organization Update Required</Heading>
			<Text style={paragraph}>Dear {userName},</Text>
			<Text style={paragraph}>
				The <strong>{orgLabel}</strong> you were associated with has been
				removed from the ChECA Lab system by an administrator.
			</Text>
			<Text style={paragraph}>
				To continue using the ChECA Lab services, please update your profile
				with a valid {orgLabel.toLowerCase()} affiliation. You can do this by
				visiting your account settings or contacting an administrator for
				assistance.
			</Text>
			<Text style={paragraph}>
				If you have any questions or need help updating your information, please
				don&apos;t hesitate to contact our support team.
			</Text>
			<Button href={dashboardUrl} style={button}>
				Update My Profile
			</Button>
			<Text style={footer}>
				This is an automated message from ChECA Lab. Please do not reply
				directly to this email.
			</Text>
		</BaseLayout>
	);
}

// Styles
const heading = {
	fontSize: "24px",
	fontWeight: "bold" as const,
	color: "#1e293b",
	marginBottom: "24px",
};

const paragraph = {
	fontSize: "14px",
	lineHeight: "24px",
	color: "#475569",
	marginBottom: "16px",
};

const button = {
	backgroundColor: "#2563eb",
	borderRadius: "6px",
	color: "#ffffff",
	fontSize: "14px",
	fontWeight: "600" as const,
	padding: "12px 24px",
	textDecoration: "none",
	textAlign: "center" as const,
	display: "inline-block",
	marginTop: "16px",
};

const footer = {
	fontSize: "12px",
	color: "#94a3b8",
	marginTop: "32px",
	borderTop: "1px solid #e2e8f0",
	paddingTop: "16px",
};
