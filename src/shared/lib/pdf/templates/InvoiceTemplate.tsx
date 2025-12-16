/**
 * Invoice PDF Template
 * Generates an official invoice document for ChECA Lab services
 */

import path from "node:path";
import {
	Document,
	Image,
	Page,
	StyleSheet,
	Text,
	View,
} from "@react-pdf/renderer";
import { facilityConfig } from "@/shared/lib/pdf/config/facility-config";
import {
	styles as baseStyles,
	formatCurrency,
	formatDate,
	pdfColors,
} from "@/shared/lib/pdf/pdf-styles";

// Get file system path for images (react-pdf needs absolute paths)
const getImagePath = (imageName: string) => {
	return path.join(process.cwd(), "public", "images", imageName);
};

// Invoice-specific styles
const invoiceStyles = StyleSheet.create({
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 20,
		paddingBottom: 15,
		borderBottomWidth: 2,
		borderBottomColor: pdfColors.primary,
	},
	headerLeft: {
		width: "50%",
	},
	headerRight: {
		width: "50%",
		alignItems: "flex-end",
	},
	logo: {
		width: 100,
		height: 50,
		marginBottom: 8,
	},
	companyName: {
		fontSize: 12,
		fontWeight: 700,
		color: pdfColors.primary,
		marginBottom: 2,
	},
	companyDetail: {
		fontSize: 8,
		color: pdfColors.secondary,
		marginBottom: 1,
	},
	invoiceTitle: {
		fontSize: 20,
		fontWeight: 700,
		color: pdfColors.primary,
		marginBottom: 10,
	},
	invoiceRef: {
		fontSize: 10,
		color: pdfColors.secondary,
		marginBottom: 4,
	},
	metadataSection: {
		flexDirection: "row",
		marginBottom: 20,
	},
	metadataLeft: {
		width: "60%",
	},
	metadataRight: {
		width: "40%",
		backgroundColor: pdfColors.lightBg,
		padding: 10,
		borderRadius: 4,
	},
	metadataLabel: {
		fontSize: 9,
		fontWeight: 700,
		color: pdfColors.secondary,
		marginBottom: 2,
	},
	metadataValue: {
		fontSize: 10,
		color: pdfColors.black,
		marginBottom: 8,
	},
	customerSection: {
		marginBottom: 15,
	},
	customerTitle: {
		fontSize: 10,
		fontWeight: 700,
		color: pdfColors.secondary,
		marginBottom: 5,
	},
	customerDetail: {
		fontSize: 10,
		color: pdfColors.black,
		marginBottom: 2,
	},
	table: {
		marginTop: 10,
		marginBottom: 20,
	},
	tableHeader: {
		flexDirection: "row",
		backgroundColor: pdfColors.primary,
		borderTopLeftRadius: 4,
		borderTopRightRadius: 4,
	},
	tableRow: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: pdfColors.border,
	},
	tableRowAlt: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: pdfColors.border,
		backgroundColor: pdfColors.lightBg,
	},
	colNo: {
		width: "8%",
		padding: 8,
		textAlign: "center",
	},
	colDesc: {
		width: "40%",
		padding: 8,
	},
	colQty: {
		width: "12%",
		padding: 8,
		textAlign: "center",
	},
	colUnit: {
		width: "20%",
		padding: 8,
		textAlign: "right",
	},
	colTotal: {
		width: "20%",
		padding: 8,
		textAlign: "right",
	},
	headerText: {
		fontSize: 9,
		fontWeight: 700,
		color: pdfColors.white,
	},
	cellText: {
		fontSize: 9,
		color: pdfColors.black,
	},
	totalsSection: {
		flexDirection: "row",
		justifyContent: "flex-end",
		marginTop: 10,
	},
	totalsBox: {
		width: "40%",
	},
	totalRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 4,
		paddingHorizontal: 8,
		borderBottomWidth: 1,
		borderBottomColor: pdfColors.border,
	},
	totalRowFinal: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 8,
		paddingHorizontal: 8,
		backgroundColor: pdfColors.primary,
		borderBottomLeftRadius: 4,
		borderBottomRightRadius: 4,
	},
	totalLabel: {
		fontSize: 10,
		fontWeight: 700,
		color: pdfColors.secondary,
	},
	totalValue: {
		fontSize: 10,
		color: pdfColors.black,
	},
	totalLabelFinal: {
		fontSize: 11,
		fontWeight: 700,
		color: pdfColors.white,
	},
	totalValueFinal: {
		fontSize: 11,
		fontWeight: 700,
		color: pdfColors.white,
	},
	termsSection: {
		marginTop: 20,
		padding: 12,
		backgroundColor: pdfColors.lightBg,
		borderRadius: 4,
	},
	termsTitle: {
		fontSize: 10,
		fontWeight: 700,
		color: pdfColors.primary,
		marginBottom: 8,
	},
	termsText: {
		fontSize: 9,
		color: pdfColors.secondary,
		lineHeight: 1.5,
		marginBottom: 4,
	},
	termsBold: {
		fontSize: 9,
		fontWeight: 700,
		color: pdfColors.black,
	},
	bankDetails: {
		marginTop: 10,
		paddingTop: 10,
		borderTopWidth: 1,
		borderTopColor: pdfColors.border,
	},
	bankTitle: {
		fontSize: 9,
		fontWeight: 700,
		color: pdfColors.primary,
		marginBottom: 4,
	},
	bankText: {
		fontSize: 9,
		color: pdfColors.black,
		marginBottom: 2,
	},
	verificationPage: {
		marginTop: 30,
	},
	verificationTitle: {
		fontSize: 14,
		fontWeight: 700,
		color: pdfColors.primary,
		textAlign: "center",
		marginBottom: 20,
	},
	verificationSection: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 20,
	},
	verificationBox: {
		width: "48%",
		borderWidth: 1,
		borderColor: pdfColors.border,
		padding: 15,
		borderRadius: 4,
	},
	verificationBoxTitle: {
		fontSize: 10,
		fontWeight: 700,
		color: pdfColors.primary,
		marginBottom: 15,
		textAlign: "center",
		paddingBottom: 8,
		borderBottomWidth: 1,
		borderBottomColor: pdfColors.border,
	},
	signatureLine: {
		borderBottomWidth: 1,
		borderBottomColor: pdfColors.black,
		marginTop: 50,
		marginBottom: 5,
	},
	signatureLabel: {
		fontSize: 8,
		color: pdfColors.secondary,
		marginBottom: 20,
	},
	footer: {
		position: "absolute",
		bottom: 30,
		left: 40,
		right: 40,
		textAlign: "center",
		fontSize: 8,
		color: pdfColors.secondary,
		borderTopWidth: 1,
		borderTopColor: pdfColors.border,
		paddingTop: 10,
	},
});

// Types
export interface InvoiceLineItem {
	description: string;
	quantity: number;
	unitPrice: number;
	total: number;
}

export interface CustomerDetails {
	name: string;
	address: string;
	email: string;
	phone?: string;
	faculty?: string;
	department?: string;
}

export interface InvoiceTemplateProps {
	invoiceNo: string;
	date: Date | string;
	dueDate?: Date | string;
	customerDetails: CustomerDetails;
	items: InvoiceLineItem[];
	subtotal: number;
	grandTotal: number;
	referenceNumber?: string;
}

export function InvoiceTemplate({
	invoiceNo,
	date,
	dueDate,
	customerDetails,
	items,
	subtotal,
	grandTotal,
	referenceNumber,
}: InvoiceTemplateProps) {
	return (
		<Document>
			{/* Page 1: Invoice Details */}
			<Page size="A4" style={baseStyles.page}>
				{/* Header */}
				<View style={invoiceStyles.header}>
					<View style={invoiceStyles.headerLeft}>
						<Image
							src={getImagePath("utm-logo.png")}
							style={invoiceStyles.logo}
						/>
						<Text style={invoiceStyles.companyName}>
							Financial Unit / MJIIT
						</Text>
						<Text style={invoiceStyles.companyDetail}>
							Universiti Teknologi Malaysia
						</Text>
						<Text style={invoiceStyles.companyDetail}>
							Malaysia-Japan International Institute of Technology
						</Text>
						<Text style={invoiceStyles.companyDetail}>
							Jalan Sultan Yahya Petra, 54100 Kuala Lumpur
						</Text>
					</View>
					<View style={invoiceStyles.headerRight}>
						<Text style={invoiceStyles.invoiceTitle}>INVOICE</Text>
						<Text style={invoiceStyles.invoiceRef}>
							Invoice No: {invoiceNo}
						</Text>
						<Text style={invoiceStyles.invoiceRef}>
							Date: {formatDate(date)}
						</Text>
						{dueDate && (
							<Text style={invoiceStyles.invoiceRef}>
								Due Date: {formatDate(dueDate)}
							</Text>
						)}
						{referenceNumber && (
							<Text style={invoiceStyles.invoiceRef}>
								Ref: {referenceNumber}
							</Text>
						)}
					</View>
				</View>

				{/* Customer Information */}
				<View style={invoiceStyles.metadataSection}>
					<View style={invoiceStyles.metadataLeft}>
						<View style={invoiceStyles.customerSection}>
							<Text style={invoiceStyles.customerTitle}>BILL TO:</Text>
							<Text style={invoiceStyles.customerDetail}>
								{customerDetails.name}
							</Text>
							{customerDetails.faculty && (
								<Text style={invoiceStyles.customerDetail}>
									{customerDetails.faculty}
								</Text>
							)}
							{customerDetails.department && (
								<Text style={invoiceStyles.customerDetail}>
									{customerDetails.department}
								</Text>
							)}
							<Text style={invoiceStyles.customerDetail}>
								{customerDetails.address}
							</Text>
							<Text style={invoiceStyles.customerDetail}>
								{customerDetails.email}
							</Text>
							{customerDetails.phone && (
								<Text style={invoiceStyles.customerDetail}>
									Tel: {customerDetails.phone}
								</Text>
							)}
						</View>
					</View>
					<View style={invoiceStyles.metadataRight}>
						<Text style={invoiceStyles.metadataLabel}>Invoice Number</Text>
						<Text style={invoiceStyles.metadataValue}>{invoiceNo}</Text>
						<Text style={invoiceStyles.metadataLabel}>Invoice Date</Text>
						<Text style={invoiceStyles.metadataValue}>{formatDate(date)}</Text>
						{dueDate && (
							<>
								<Text style={invoiceStyles.metadataLabel}>Due Date</Text>
								<Text style={invoiceStyles.metadataValue}>
									{formatDate(dueDate)}
								</Text>
							</>
						)}
					</View>
				</View>

				{/* Items Table */}
				<View style={invoiceStyles.table}>
					{/* Table Header */}
					<View style={invoiceStyles.tableHeader}>
						<View style={invoiceStyles.colNo}>
							<Text style={invoiceStyles.headerText}>No</Text>
						</View>
						<View style={invoiceStyles.colDesc}>
							<Text style={invoiceStyles.headerText}>Description</Text>
						</View>
						<View style={invoiceStyles.colQty}>
							<Text style={invoiceStyles.headerText}>Qty</Text>
						</View>
						<View style={invoiceStyles.colUnit}>
							<Text style={invoiceStyles.headerText}>Unit Charge</Text>
						</View>
						<View style={invoiceStyles.colTotal}>
							<Text style={invoiceStyles.headerText}>Total</Text>
						</View>
					</View>

					{/* Table Body */}
					{items.map((item, index) => (
						<View
							key={`item-${item.description}-${index}`}
							style={
								index % 2 === 0
									? invoiceStyles.tableRow
									: invoiceStyles.tableRowAlt
							}
						>
							<View style={invoiceStyles.colNo}>
								<Text style={invoiceStyles.cellText}>{index + 1}</Text>
							</View>
							<View style={invoiceStyles.colDesc}>
								<Text style={invoiceStyles.cellText}>{item.description}</Text>
							</View>
							<View style={invoiceStyles.colQty}>
								<Text style={invoiceStyles.cellText}>{item.quantity}</Text>
							</View>
							<View style={invoiceStyles.colUnit}>
								<Text style={invoiceStyles.cellText}>
									{formatCurrency(item.unitPrice)}
								</Text>
							</View>
							<View style={invoiceStyles.colTotal}>
								<Text style={invoiceStyles.cellText}>
									{formatCurrency(item.total)}
								</Text>
							</View>
						</View>
					))}
				</View>

				{/* Totals */}
				<View style={invoiceStyles.totalsSection}>
					<View style={invoiceStyles.totalsBox}>
						<View style={invoiceStyles.totalRow}>
							<Text style={invoiceStyles.totalLabel}>SUB TOTAL</Text>
							<Text style={invoiceStyles.totalValue}>
								{formatCurrency(subtotal)}
							</Text>
						</View>
						<View style={invoiceStyles.totalRowFinal}>
							<Text style={invoiceStyles.totalLabelFinal}>TOTAL (RM)</Text>
							<Text style={invoiceStyles.totalValueFinal}>
								{formatCurrency(grandTotal)}
							</Text>
						</View>
					</View>
				</View>

				{/* Terms & Conditions */}
				<View style={invoiceStyles.termsSection}>
					<Text style={invoiceStyles.termsTitle}>Terms & Conditions</Text>
					<Text style={invoiceStyles.termsText}>
						<Text style={invoiceStyles.termsBold}>
							Payment MUST be made within 14 days
						</Text>{" "}
						from the date of this invoice. Please ensure that payment is made to
						the account details provided below.
					</Text>
					<Text style={invoiceStyles.termsText}>
						• Payment must include the invoice number as reference
					</Text>
					<Text style={invoiceStyles.termsText}>
						• Services will not be rendered until payment is verified
					</Text>

					<View style={invoiceStyles.bankDetails}>
						<Text style={invoiceStyles.bankTitle}>Bank Details:</Text>
						<Text style={invoiceStyles.bankText}>
							Account Name: Bendahari UTM
						</Text>
						<Text style={invoiceStyles.bankText}>Bank: Bank Islam</Text>
						<Text style={invoiceStyles.bankText}>
							Account No: 1403 2010 035 630
						</Text>
					</View>
				</View>

				{/* Footer */}
				<View fixed style={invoiceStyles.footer}>
					<Text>
						This is a computer-generated invoice. No signature is required.
					</Text>
					<Text>
						{facilityConfig.facilityName} | MJIIT | Universiti Teknologi
						Malaysia
					</Text>
				</View>
			</Page>

			{/* Page 2: Verification Page */}
			<Page size="A4" style={baseStyles.page}>
				<View style={invoiceStyles.verificationPage}>
					<Text style={invoiceStyles.verificationTitle}>
						INVOICE VERIFICATION
					</Text>
					<Text
						style={[
							invoiceStyles.invoiceRef,
							{ textAlign: "center", marginBottom: 20 },
						]}
					>
						Invoice No: {invoiceNo} | Date: {formatDate(date)}
					</Text>

					<View style={invoiceStyles.verificationSection}>
						{/* Customer Verification */}
						<View style={invoiceStyles.verificationBox}>
							<Text style={invoiceStyles.verificationBoxTitle}>
								CUSTOMER AUTHORIZED VERIFICATION
							</Text>
							<Text style={invoiceStyles.signatureLabel}>
								I hereby confirm that the services listed in this invoice have
								been received and are acceptable.
							</Text>
							<View style={invoiceStyles.signatureLine} />
							<Text style={invoiceStyles.signatureLabel}>
								Authorized Signature
							</Text>
							<View style={invoiceStyles.signatureLine} />
							<Text style={invoiceStyles.signatureLabel}>Name</Text>
							<View style={invoiceStyles.signatureLine} />
							<Text style={invoiceStyles.signatureLabel}>Designation</Text>
							<View style={invoiceStyles.signatureLine} />
							<Text style={invoiceStyles.signatureLabel}>Date</Text>
							<View style={invoiceStyles.signatureLine} />
							<Text style={invoiceStyles.signatureLabel}>Official Stamp</Text>
						</View>

						{/* Service Provider Verification */}
						<View style={invoiceStyles.verificationBox}>
							<Text style={invoiceStyles.verificationBoxTitle}>
								SERVICE PROVIDER VERIFICATION
							</Text>
							<Text style={invoiceStyles.signatureLabel}>
								I hereby certify that the services listed in this invoice have
								been provided as described.
							</Text>
							<View style={invoiceStyles.signatureLine} />
							<Text style={invoiceStyles.signatureLabel}>
								Authorized Signature
							</Text>
							<View style={invoiceStyles.signatureLine} />
							<Text style={invoiceStyles.signatureLabel}>Name</Text>
							<View style={invoiceStyles.signatureLine} />
							<Text style={invoiceStyles.signatureLabel}>Designation</Text>
							<View style={invoiceStyles.signatureLine} />
							<Text style={invoiceStyles.signatureLabel}>Date</Text>
							<View style={invoiceStyles.signatureLine} />
							<Text style={invoiceStyles.signatureLabel}>Official Stamp</Text>
						</View>
					</View>
				</View>

				{/* Footer */}
				<View fixed style={invoiceStyles.footer}>
					<Text>Page 2 of 2 | Verification Form</Text>
					<Text>
						{facilityConfig.facilityName} | MJIIT | Universiti Teknologi
						Malaysia
					</Text>
				</View>
			</Page>
		</Document>
	);
}
