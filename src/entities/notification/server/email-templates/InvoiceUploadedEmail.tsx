/**
 * Invoice Uploaded Email Template
 */

import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

interface InvoiceUploadedEmailProps {
	customerName: string;
	invoiceNumber: string;
	amount: string;
	dueDate: string;
	bookingReference: string;
	dashboardUrl: string;
}

export function InvoiceUploadedEmail({
	customerName,
	invoiceNumber,
	amount,
	dueDate,
	bookingReference,
	dashboardUrl,
}: InvoiceUploadedEmailProps) {
	return (
		<BaseLayout preview={`New invoice ${invoiceNumber} is ready`}>
			<Heading style={heading}>Invoice Ready</Heading>
			<Text style={paragraph}>Dear {customerName},</Text>
			<Text style={paragraph}>
				A new invoice has been generated for your booking. Please review and
				process the payment at your earliest convenience.
			</Text>

			<Text style={detailsBox}>
				<strong>Invoice Number:</strong> {invoiceNumber}
				<br />
				<strong>Amount Due:</strong> {amount}
				<br />
				<strong>Due Date:</strong> {dueDate}
				<br />
				<strong>Booking Reference:</strong> {bookingReference}
			</Text>

			<Text style={paragraph}>
				You can download the invoice and upload your proof of payment from your
				dashboard.
			</Text>

			<Button href={dashboardUrl} style={button}>
				View Invoice
			</Button>

			<Text style={noteText}>
				<strong>Note:</strong> Analysis results will be released once payment
				has been verified.
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

export default InvoiceUploadedEmail;
