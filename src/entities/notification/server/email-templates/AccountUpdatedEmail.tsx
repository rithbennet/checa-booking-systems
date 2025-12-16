/**
 * Account Updated Email Template
 * Sent when an admin updates a user's account information
 */

import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

interface AccountUpdatedEmailProps {
	customerName: string;
	dashboardUrl: string;
	changedFields: string[];
}

export function AccountUpdatedEmail({
	customerName,
	dashboardUrl,
	changedFields,
}: AccountUpdatedEmailProps) {
	// Map field names to user-friendly labels
	const fieldLabels: Record<string, string> = {
		firstName: "First Name",
		lastName: "Last Name",
		phone: "Phone Number",
		userType: "Account Type",
		academicType: "Academic Type",
		userIdentifier: "User Identifier",
		supervisorName: "Supervisor Name",
		facultyId: "Faculty",
		departmentId: "Department",
		ikohzaId: "iKohza",
		companyId: "Company",
		companyBranchId: "Company Branch",
		status: "Account Status",
	};

	const changedFieldLabels = changedFields.map(
		(field) => fieldLabels[field] || field,
	);

	return (
		<BaseLayout preview="Your ChECA Lab account information has been updated">
			<Heading style={heading}>Account Information Updated</Heading>
			<Text style={paragraph}>Dear {customerName},</Text>
			<Text style={paragraph}>
				An administrator has updated your ChECA Lab account information. The
				following details have been changed:
			</Text>
			<ul style={list}>
				{changedFieldLabels.map((label) => (
					<li key={label} style={listItem}>
						{label}
					</li>
				))}
			</ul>
			<Text style={paragraph}>
				If you did not request these changes or believe this is an error, please
				contact our support team immediately.
			</Text>
			<Button href={dashboardUrl} style={button}>
				View My Profile
			</Button>
			<Text style={paragraph}>Thank you for using ChECA Lab services.</Text>
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

export default AccountUpdatedEmail;
