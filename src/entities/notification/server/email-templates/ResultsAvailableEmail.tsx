/**
 * Results Available Email Template
 */

import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

interface ResultsAvailableEmailProps {
	customerName: string;
	sampleIdentifier: string;
	serviceName: string;
	bookingReference: string;
	dashboardUrl: string;
}

export function ResultsAvailableEmail({
	customerName,
	sampleIdentifier,
	serviceName,
	bookingReference,
	dashboardUrl,
}: ResultsAvailableEmailProps) {
	return (
		<BaseLayout preview={`Results ready for ${sampleIdentifier}`}>
			<Heading style={heading}>Results Available</Heading>
			<Text style={paragraph}>Dear {customerName},</Text>
			<Text style={paragraph}>
				Great news! The analysis results for your sample are now available for
				download.
			</Text>

			<Text style={detailsBox}>
				<strong>Sample ID:</strong> {sampleIdentifier}
				<br />
				<strong>Service:</strong> {serviceName}
				<br />
				<strong>Booking Reference:</strong> {bookingReference}
			</Text>

			<Text style={paragraph}>
				You can download your results from the dashboard. If you have any
				questions about the results, please don't hesitate to contact our team.
			</Text>

			<Button href={dashboardUrl} style={button}>
				Download Results
			</Button>

			<Text style={paragraph}>
				Thank you for choosing ChECA Lab for your analytical needs. We hope to
				serve you again!
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

const detailsBox = {
	fontSize: "14px",
	lineHeight: "28px",
	color: "#1e293b",
	backgroundColor: "#f0fdf4",
	padding: "16px",
	borderRadius: "8px",
	border: "1px solid #bbf7d0",
	margin: "16px 0",
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

export default ResultsAvailableEmail;
