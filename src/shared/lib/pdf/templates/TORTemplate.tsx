/**
 * Invoice Request Form Template
 * Replicates the UTM MJIIT Invoice Request Form
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
import { formatDate } from "@/shared/lib/pdf/pdf-styles";

// Get file system path for images (react-pdf needs absolute paths)
const getImagePath = (imageName: string) => {
	return path.join(process.cwd(), "public", "images", imageName);
};

// Helper to determine if an image source is a URL or file path
const getImageSource = (src: string | null | undefined): string => {
	if (!src) return "";
	// If it starts with http:// or https://, it's a URL
	if (src.startsWith("http://") || src.startsWith("https://")) {
		return src;
	}
	// Otherwise, treat it as a file path in public/images/
	return getImagePath(src);
};

/**
 * Generate address for TOR template based on user type and organization data
 */
function generateTORAddress({
	userType,
	userAddress,
	department,
	faculty,
	ikohza,
	utmLocation,
}: {
	userType:
	| "mjiit_member"
	| "utm_member"
	| "external_member"
	| "lab_administrator";
	userAddress?: string | null;
	department?: string | null;
	faculty?: string | null;
	ikohza?: string | null;
	utmLocation?: "johor_bahru" | "kuala_lumpur" | "none" | null;
}): string {
	// External members use their provided address
	if (userType === "external_member") {
		return userAddress?.trim() || "";
	}

	// For UTM and MJIIT members, build address from organization data
	const parts: string[] = [];

	// Add department if available
	if (department?.trim()) {
		parts.push(department.trim());
	}

	// Add ikohza for MJIIT members if available
	if (userType === "mjiit_member" && ikohza?.trim()) {
		parts.push(ikohza.trim());
	}

	// Add faculty if available
	if (faculty?.trim()) {
		parts.push(faculty.trim());
	}

	// Add UTM location
	if (userType === "mjiit_member") {
		// MJIIT is always in KL
		parts.push("UTM KL");
	} else if (userType === "utm_member") {
		// UTM members use their specified location
		if (utmLocation === "kuala_lumpur") {
			parts.push("UTM KL");
		} else if (utmLocation === "johor_bahru") {
			parts.push("UTM JB");
		}
	}

	return parts.filter(Boolean).join(", ") || userAddress?.trim() || "";
}

// Specific styles for the Invoice Form
const invoiceStyles = StyleSheet.create({
	page: {
		padding: 30,
		fontSize: 10,
		fontFamily: "Helvetica",
	},
	// Header Section
	header: {
		flexDirection: "row",
		marginBottom: 20,
		borderBottomWidth: 1,
		borderBottomColor: "#000",
		paddingBottom: 10,
	},
	logoSection: {
		width: "35%",
	},
	logo: {
		width: 200,
		height: "auto", // Maintain aspect ratio
	},
	headerTextSection: {
		width: "65%",
		paddingLeft: 20,
	},
	headerTitle: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#bfbfbf", // Light gray title as per image (looks like watermark or header)
		textAlign: "center",
		marginBottom: 10,
		textTransform: "uppercase",
	},
	addressBox: {
		fontSize: 9,
		marginBottom: 5,
	},

	// General Table/Grid Utils
	tableBorder: {
		borderWidth: 1,
		borderColor: "#000",
	},
	row: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: "#000",
		alignItems: "stretch", // Ensure equal height
	},
	lastRow: {
		borderBottomWidth: 0,
	},
	cellLabel: {
		backgroundColor: "#f3f4f6", // Light gray for labels? Optional, white in PDF
		padding: 4,
		fontSize: 9,
		width: "25%", // Adjust label width
		borderRightWidth: 1,
		borderRightColor: "#000",
	},
	cellValue: {
		padding: 4,
		fontSize: 9,
		flex: 1,
	},

	// Info Grid Specifics
	infoGrid: {
		borderWidth: 1,
		borderColor: "#000",
		marginBottom: 20,
	},
	infoRow: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: "#000",
		minHeight: 20,
	},
	infoRowLast: {
		flexDirection: "row",
		minHeight: 20,
	},
	// Left cell (label + value)
	infoCellLeft: {
		width: "60%",
		flexDirection: "row",
		borderRightWidth: 1,
		borderRightColor: "#000",
	},
	// Right cell (label + value)
	infoCellRight: {
		width: "40%",
		flexDirection: "row",
	},
	infoLabel: {
		width: 100,
		padding: 4,
		fontSize: 9,
		fontWeight: "bold",
		borderRightWidth: 1,
		borderRightColor: "#000",
	},
	infoLabelWide: {
		width: 100,
		padding: 4,
		fontSize: 9,
		fontWeight: "bold",
		borderRightWidth: 1,
		borderRightColor: "#000",
	},
	infoValue: {
		flex: 1,
		padding: 4,
		fontSize: 9,
	},

	// Content Text
	letterBody: {
		marginBottom: 15,
		fontSize: 10,
		lineHeight: 1.4,
	},

	// Pricing Table
	pricingTable: {
		borderWidth: 1,
		borderColor: "#000",
		marginBottom: 5,
	},
	pricingHeader: {
		flexDirection: "row",
		backgroundColor: "#fff", // Header is white in screenshot
		borderBottomWidth: 1,
		borderBottomColor: "#000",
	},
	pricingRow: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: "#000",
		minHeight: 20,
		alignItems: "stretch",
	},
	colNo: {
		width: "8%",
		borderRightWidth: 1,
		borderRightColor: "#000",
		padding: 4,
		alignItems: "center",
		justifyContent: "center",
	},
	colDesc: {
		width: "47%",
		borderRightWidth: 1,
		borderRightColor: "#000",
		padding: 4,
		alignItems: "center",
	},
	colQty: {
		width: "15%",
		borderRightWidth: 1,
		borderRightColor: "#000",
		padding: 4,
		alignItems: "center",
		justifyContent: "center",
	},
	colUnit: {
		width: "15%",
		borderRightWidth: 1,
		borderRightColor: "#000",
		padding: 4,
		alignItems: "center",
		justifyContent: "center",
	},
	colTotal: {
		width: "15%",
		padding: 4,
		alignItems: "center",
		justifyContent: "center",
	},

	// Terms Section
	termsContainer: {
		marginTop: 10,
		borderWidth: 1,
		borderColor: "#000",
		backgroundColor: "#e5e7eb", // Gray background for header
		padding: 5,
		marginBottom: 0,
	},
	termsTitle: {
		fontWeight: "bold",
		textAlign: "center",
		fontSize: 10,
	},
	termsBody: {
		paddingTop: 10,
		paddingBottom: 10,
	},
	termItem: {
		flexDirection: "row",
		marginBottom: 4,
		paddingLeft: 5,
		paddingRight: 5,
	},
	termBullet: {
		width: 25,
		fontSize: 9,
	},
	termText: {
		flex: 1,
		fontSize: 9,
		lineHeight: 1.3,
		textAlign: "justify",
	},
	bankDetails: {
		marginLeft: 25,
		marginTop: 5,
		marginBottom: 5,
	},
	bankRow: {
		flexDirection: "row",
		marginBottom: 2,
	},
	bankLabel: {
		width: 120,
		fontSize: 9,
	},

	// Page 2: Verification
	verificationSection: {
		flexDirection: "row",
		borderWidth: 1,
		borderColor: "#000",
		marginTop: 20,
		marginBottom: 15,
	},
	verifCol: {
		width: "50%",
		padding: 0,
	},
	verifHeader: {
		backgroundColor: "#d1d5db", // Gray
		padding: 5,
		textAlign: "center",
		fontWeight: "bold",
		borderBottomWidth: 1,
		borderBottomColor: "#000",
		fontSize: 10,
	},
	verifContent: {
		padding: 10,
		height: 120, // Fixed height for signature area
		justifyContent: "space-between",
	},
	borderRight: {
		borderRightWidth: 1,
		borderRightColor: "#000",
	},

	// Payment Checkboxes
	paymentRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 15,
		marginTop: 5,
	},
	checkbox: {
		width: 12,
		height: 12,
		borderWidth: 1,
		borderColor: "#000",
		marginRight: 5,
		marginLeft: 15,
	},

	// Checklist Gray Box
	grayBoxHeader: {
		backgroundColor: "#d1d5db",
		borderWidth: 1,
		borderColor: "#000",
		padding: 5,
		textAlign: "center",
		fontWeight: "bold",
		fontSize: 10,
	},
	checklistBody: {
		borderLeftWidth: 1,
		borderRightWidth: 1,
		borderBottomWidth: 1,
		borderColor: "#000",
		padding: 10,
		marginBottom: 15,
	},
	checkItem: {
		flexDirection: "row",
		marginBottom: 8,
		alignItems: "flex-start",
	},
	checkLabel: {
		flex: 1,
		fontSize: 9,
		marginRight: 10,
	},
	checkOptions: {
		flexDirection: "row",
		minWidth: 100,
	},
	smallCheck: {
		width: 10,
		height: 10,
		borderWidth: 1,
		borderColor: "#000",
		marginRight: 3,
	},
	smallCheckLabel: {
		fontSize: 9,
		marginRight: 8,
	},

	// Declaration
	declarationBody: {
		borderLeftWidth: 1,
		borderRightWidth: 1,
		borderBottomWidth: 1,
		borderColor: "#000",
		padding: 10,
	},
	sigLine: {
		borderBottomWidth: 1,
		borderBottomColor: "#000",
		borderStyle: "dotted",
		flex: 1,
		marginLeft: 5,
		marginTop: 8,
	},
});

export interface LineItem {
	description: string;
	quantity: number;
	unitCharge: number;
	unit?: string;
}

export interface InvoiceFormProps {
	// User/Client Info
	name: string;
	address: string;
	tel: string;
	email: string;
	supervisorName?: string;
	supervisorEmail?: string;

	// Facility/Admin Info
	facility: string;
	date: Date | string;
	staffPic: string;
	staffPicEmail: string;
	staffPicSignatureImageUrl?: string | null;
	costCentre?: string;
	refNo: string;

	// Line Items
	items: LineItem[];

	// Verification Data (Optional - for pre-filling)
	providerName?: string;
	providerDate?: Date | string;
}

// TORTemplate Props - simplified interface for document generation
export interface TORTemplateProps {
	userName: string;
	userEmail: string;
	userFaculty?: string;
	userDepartment?: string;
	userIkohza?: string;
	utmLocation?: "johor_bahru" | "kuala_lumpur" | "none" | null;
	supervisorName?: string;
	equipmentCode?: string;
	equipmentName?: string;
	refNo: string;
	date: Date | string;
	// Additional optional props for full data
	userAddress?: string;
	userTel?: string;
	serviceItems?: Array<{
		service: {
			name: string;
			code?: string;
		};
		quantity: number;
		unitPrice: number | string;
		totalPrice: number | string;
		sampleName?: string;
		unit?: string;
	}>;
	userType?:
	| "mjiit_member"
	| "utm_member"
	| "external_member"
	| "lab_administrator";
	// Facility config props
	facilityName: string;
	staffPicName: string;
	staffPicEmail: string;
	staffPicFullName: string;
	staffPicSignatureImageUrl?: string | null;
}

export function InvoiceRequestForm({
	name,
	address,
	tel,
	email,
	supervisorName = "",
	supervisorEmail = "",
	facility,
	date,
	staffPic,
	staffPicEmail,
	staffPicSignatureImageUrl,
	costCentre = "",
	refNo,
	items = [],
	providerName,
	providerDate,
}: InvoiceFormProps) {
	const formattedDate = typeof date === "string" ? date : formatDate(date);
	const subTotal = items.reduce(
		(acc, item) => acc + item.quantity * item.unitCharge,
		0,
	);

	// Fill empty rows to make the table look standard height if needed
	const minRows = 4;
	const emptyRows = Math.max(0, minRows - items.length);

	return (
		<Document>
			{/* Page 1: Header, Info Grid, Salutation, and Pricing Table */}
			<Page size="A4" style={invoiceStyles.page} wrap={false}>
				{/* Header Title Layer */}
				<Text
					style={[
						invoiceStyles.headerTitle,
						{ position: "absolute", top: 30, left: 0, right: 0 },
					]}
				>
					REQUEST FORM FOR INVOICE
				</Text>

				{/* Header Content */}
				<View style={[invoiceStyles.header, { marginTop: 25 }]}>
					<View style={invoiceStyles.logoSection}>
						<Image
							src={getImagePath("utm-logo.png")}
							style={invoiceStyles.logo}
						/>
					</View>
					<View style={invoiceStyles.headerTextSection}>
						<Text style={{ fontSize: 10, fontWeight: "bold" }}>
							Financial Unit
						</Text>
						<Text style={{ fontSize: 9 }}>
							Malaysia - Japan International Institute of Technology (MJIIT)
						</Text>
						<Text style={{ fontSize: 9 }}>Jalan Sultan Yahya Petra,</Text>
						<Text style={{ fontSize: 9 }}>54100 Kuala Lumpur</Text>
					</View>
				</View>

				{/* User & Facility Information Grid */}
				<View style={invoiceStyles.infoGrid}>
					{/* Row 1: Name | Facility/Lab */}
					<View style={invoiceStyles.infoRow}>
						<View style={invoiceStyles.infoCellLeft}>
							<Text style={invoiceStyles.infoLabel}>Name:</Text>
							<Text style={invoiceStyles.infoValue}>{name}</Text>
						</View>
						<View style={invoiceStyles.infoCellRight}>
							<Text style={invoiceStyles.infoLabel}>Facility/Lab:</Text>
							<Text style={invoiceStyles.infoValue}>{facility}</Text>
						</View>
					</View>

					{/* Row 2: Address | Date */}
					<View style={invoiceStyles.infoRow}>
						<View style={[invoiceStyles.infoCellLeft, { minHeight: 40 }]}>
							<Text style={invoiceStyles.infoLabel}>Address:</Text>
							<Text style={invoiceStyles.infoValue}>{address}</Text>
						</View>
						<View style={invoiceStyles.infoCellRight}>
							<Text style={invoiceStyles.infoLabel}>Date:</Text>
							<Text style={invoiceStyles.infoValue}>{formattedDate}</Text>
						</View>
					</View>

					{/* Row 3: (empty left for address continuation visually) | Staff PIC */}
					<View style={invoiceStyles.infoRow}>
						<View style={invoiceStyles.infoCellLeft}>
							<Text style={invoiceStyles.infoLabel}>Tel:</Text>
							<Text style={invoiceStyles.infoValue}>{tel}</Text>
						</View>
						<View style={invoiceStyles.infoCellRight}>
							<Text style={invoiceStyles.infoLabel}>Staff PIC:</Text>
							<Text style={invoiceStyles.infoValue}>{staffPic}</Text>
						</View>
					</View>

					{/* Row 4: Tel | Email PIC */}
					<View style={invoiceStyles.infoRow}>
						<View style={invoiceStyles.infoCellLeft}>
							<Text style={invoiceStyles.infoLabel}>Email:</Text>
							<Text style={invoiceStyles.infoValue}>{email}</Text>
						</View>
						<View style={invoiceStyles.infoCellRight}>
							<Text style={invoiceStyles.infoLabel}>Email PIC:</Text>
							<Text style={[invoiceStyles.infoValue, { fontSize: 8 }]}>
								{staffPicEmail}
							</Text>
						</View>
					</View>

					{/* Row 5: Email | Cost Centre */}
					<View style={invoiceStyles.infoRow}>
						<View style={[invoiceStyles.infoCellLeft, { minHeight: 35 }]}>
							<Text style={invoiceStyles.infoLabelWide}>
								Supervisor's Name & Email (if necessary)
							</Text>
							<View style={invoiceStyles.infoValue}>
								<Text>{supervisorName}</Text>
								<Text>{supervisorEmail}</Text>
							</View>
						</View>
						<View style={invoiceStyles.infoCellRight}>
							<Text style={invoiceStyles.infoLabel}>Cost Centre:</Text>
							<Text style={invoiceStyles.infoValue}>{costCentre}</Text>
						</View>
					</View>

					{/* Row 6: Supervisor | Ref */}
					<View style={invoiceStyles.infoRowLast}>
						<View style={invoiceStyles.infoCellLeft}>
							<Text style={invoiceStyles.infoLabel} />
							<Text style={invoiceStyles.infoValue} />
						</View>
						<View style={invoiceStyles.infoCellRight}>
							<Text style={invoiceStyles.infoLabel}>Ref</Text>
							<Text style={invoiceStyles.infoValue}>{refNo}</Text>
						</View>
					</View>
				</View>

				{/* Salutation */}
				<Text style={invoiceStyles.letterBody}>
					Dear Sir,{"\n\n"}
					<Text style={{ fontWeight: "bold", textDecoration: "underline" }}>
						RE: Charge of Service
					</Text>
					{"\n\n"}
					With refer to the above, we would like to quote you the price as
					below:
				</Text>

				{/* Pricing Table */}
				<View style={invoiceStyles.pricingTable}>
					{/* Table Header */}
					<View style={invoiceStyles.pricingHeader}>
						<View style={invoiceStyles.colNo}>
							<Text style={{ fontWeight: "bold", textAlign: "center" }}>
								No
							</Text>
						</View>
						<View style={invoiceStyles.colDesc}>
							<Text style={{ fontWeight: "bold" }}>Description</Text>
						</View>
						<View style={invoiceStyles.colQty}>
							<Text style={{ fontWeight: "bold", textAlign: "center" }}>
								Quantity
							</Text>
						</View>
						<View style={invoiceStyles.colUnit}>
							<Text style={{ fontWeight: "bold", textAlign: "center" }}>
								Unit Charge
							</Text>
						</View>
						<View style={invoiceStyles.colTotal}>
							<Text style={{ fontWeight: "bold", textAlign: "center" }}>
								Total
							</Text>
						</View>
					</View>

					{/* Items */}
					{items.map((item, idx) => (
						<View
							key={`item-${item.description}-${item.quantity}-${item.unitCharge}-${idx}`}
							style={invoiceStyles.pricingRow}
						>
							<View style={invoiceStyles.colNo}>
								<Text style={{ textAlign: "center" }}>{idx + 1}</Text>
							</View>
							<View style={invoiceStyles.colDesc}>
								<Text>{item.description}</Text>
							</View>
							<View style={invoiceStyles.colQty}>
								<Text style={{ textAlign: "center" }}>
									{item.quantity} {item.unit ?? "samples"}
								</Text>
							</View>
							<View style={invoiceStyles.colUnit}>
								<Text style={{ textAlign: "center" }}>{item.unitCharge}</Text>
							</View>
							<View style={invoiceStyles.colTotal}>
								<Text style={{ textAlign: "center" }}>
									{item.quantity * item.unitCharge}
								</Text>
							</View>
						</View>
					))}

					{/* Empty Rows for spacing */}
					{Array.from({ length: emptyRows }).map((_, idx) => (
						<View
							key={`empty-row-${items.length}-${idx}`}
							style={invoiceStyles.pricingRow}
						>
							<View style={invoiceStyles.colNo}>
								<Text></Text>
							</View>
							<View style={invoiceStyles.colDesc}>
								<Text></Text>
							</View>
							<View style={invoiceStyles.colQty}>
								<Text></Text>
							</View>
							<View style={invoiceStyles.colUnit}>
								<Text></Text>
							</View>
							<View style={invoiceStyles.colTotal}>
								<Text></Text>
							</View>
						</View>
					))}

					{/* Subtotal */}
					<View style={invoiceStyles.pricingRow}>
						<View style={[invoiceStyles.colNo, { borderRightWidth: 0 }]}>
							<Text></Text>
						</View>
						<View style={[invoiceStyles.colDesc, { borderRightWidth: 0 }]}>
							<Text></Text>
						</View>
						<View style={[invoiceStyles.colQty, { borderRightWidth: 0 }]}>
							<Text></Text>
						</View>
						<View
							style={[
								invoiceStyles.colUnit,
								{ borderRightWidth: 1, paddingRight: 5 },
							]}
						>
							<Text style={{ textAlign: "right" }}>SUB TOTAL</Text>
						</View>
						<View style={invoiceStyles.colTotal}>
							<Text style={{ textAlign: "center" }}>{subTotal}</Text>
						</View>
					</View>

					{/* Total */}
					<View style={[invoiceStyles.pricingRow, { borderBottomWidth: 0 }]}>
						<View style={[invoiceStyles.colNo, { borderRightWidth: 0 }]}>
							<Text></Text>
						</View>
						<View style={[invoiceStyles.colDesc, { borderRightWidth: 0 }]}>
							<Text></Text>
						</View>
						<View style={[invoiceStyles.colQty, { borderRightWidth: 0 }]}>
							<Text></Text>
						</View>
						<View
							style={[
								invoiceStyles.colUnit,
								{
									borderRightWidth: 1,
									paddingRight: 5,
								},
							]}
						>
							<Text style={{ textAlign: "right", fontWeight: "bold" }}>
								Total (RM)
							</Text>
						</View>
						<View style={invoiceStyles.colTotal}>
							<Text style={{ textAlign: "center", fontWeight: "bold" }}>
								{subTotal}
							</Text>
						</View>
					</View>
				</View>
			</Page>

			{/* Page 2: Terms & Conditions, Verification, Payment Methods, Checklist, Declaration */}
			<Page size="A4" style={invoiceStyles.page}>
				{/* Terms & Conditions Box */}
				<View style={invoiceStyles.termsContainer}>
					<Text style={invoiceStyles.termsTitle}>TERMS & CONDITIONS</Text>
				</View>
				<View
					style={{
						borderLeftWidth: 1,
						borderRightWidth: 1,
						borderBottomWidth: 1,
						borderColor: "#000",
						padding: 5,
					}}
				>
					<View style={invoiceStyles.termItem}>
						<Text style={invoiceStyles.termBullet}>xiii)</Text>
						<Text style={invoiceStyles.termText}>
							This service form only valid for 30 days from the date of issuance
						</Text>
					</View>
					<View style={invoiceStyles.termItem}>
						<Text style={invoiceStyles.termBullet}>xiv)</Text>
						<Text style={invoiceStyles.termText}>
							Comply with the rules that have been enforced by the faculty and
							university.
						</Text>
					</View>
					<View style={invoiceStyles.termItem}>
						<Text style={invoiceStyles.termBullet}>xv)</Text>
						<Text style={invoiceStyles.termText}>
							For analysis sampling purposes, the client is responsible in the
							preparation of research materials.
						</Text>
					</View>
					<View style={invoiceStyles.termItem}>
						<Text style={invoiceStyles.termBullet}>xvi)</Text>
						<Text style={invoiceStyles.termText}>
							For equipment rental, penalty will be added IF the
							equipment/machine used is not in good condition after the rental
							period. It is client's responsibility to ensure the experimental
							material is suitable with the equipment.
						</Text>
					</View>
					<View style={invoiceStyles.termItem}>
						<Text style={invoiceStyles.termBullet}>xvii)</Text>
						<Text style={invoiceStyles.termText}>
							The payment MUST be made within{" "}
							<Text style={{ fontWeight: "bold" }}>14 days AFTER</Text> the
							official invoice issued. Payment should be made to the following
							account:
						</Text>
					</View>

					<View style={invoiceStyles.bankDetails}>
						<View style={invoiceStyles.bankRow}>
							<Text style={invoiceStyles.bankLabel}>ACCOUNT NAME</Text>
							<Text style={{ fontSize: 9 }}>Bendahari UTM</Text>
						</View>
						<View style={invoiceStyles.bankRow}>
							<Text style={invoiceStyles.bankLabel}>BANK</Text>
							<Text style={{ fontSize: 9 }}>BANK ISLAM MALAYSIA BERHAD</Text>
						</View>
						<View style={invoiceStyles.bankRow}>
							<Text style={invoiceStyles.bankLabel}>ACCOUNT NUMBER</Text>
							<Text style={{ fontSize: 9 }}>1403 2010 035 630</Text>
						</View>
					</View>

					<View style={invoiceStyles.termItem}>
						<Text style={invoiceStyles.termBullet}>xviii)</Text>
						<Text style={invoiceStyles.termText}>
							After the payment made, proof of payment must be send to the PIC's
							email as above.
						</Text>
					</View>
				</View>

				{/* Verification Section */}
				<View style={invoiceStyles.verificationSection}>
					{/* Customer Side */}
					<View style={[invoiceStyles.verifCol, invoiceStyles.borderRight]}>
						<Text style={invoiceStyles.verifHeader}>
							Customer Authorized Verification
						</Text>
						<View style={invoiceStyles.verifContent}>
							<Text style={{ fontSize: 9, marginBottom: 15 }}>
								I hereby declare that the price offered in this service form is
								accepted and payment will be made on time.
							</Text>
							<View
								style={{
									borderBottomWidth: 1,
									borderColor: "#000",
									marginBottom: 5,
								}}
							/>
							<View style={{ flexDirection: "row", marginBottom: 2 }}>
								<Text style={{ width: 60, fontSize: 9 }}>Nama/ Name:</Text>
								<Text style={{ fontSize: 9 }}>{name}</Text>
							</View>
							<View style={{ flexDirection: "row", marginBottom: 2 }}>
								<Text style={{ width: 60, fontSize: 9 }}>IC No.:</Text>
							</View>
							<View style={{ flexDirection: "row", marginBottom: 2 }}>
								<Text style={{ width: 60, fontSize: 9 }}>Date:</Text>
							</View>
							<View style={{ flexDirection: "row" }}>
								<Text style={{ width: 60, fontSize: 9 }}>Email:</Text>
								<Text style={{ fontSize: 9 }}>{email}</Text>
							</View>
						</View>
					</View>

					{/* Service Provider Side */}
					<View style={invoiceStyles.verifCol}>
						<Text style={invoiceStyles.verifHeader}>
							Service Provider Verification
						</Text>
						<View style={invoiceStyles.verifContent}>
							<View style={{ flexDirection: "row", alignItems: "center" }}>
								<Text style={{ width: 40, fontSize: 9 }}>Name</Text>
								<Text style={{ fontSize: 9 }}>{providerName}</Text>
							</View>

							<View style={{ height: 40, marginTop: 10 }}>
								{staffPicSignatureImageUrl ? (
									<>
										<Image
											src={getImageSource(staffPicSignatureImageUrl)}
											style={{ width: "auto", maxWidth: 150, maxHeight: 60, marginBottom: 5 }}
										/>
										<Text style={{ fontSize: 9 }}>Official stamp</Text>
									</>
								) : (
									<Text style={{ fontSize: 9, marginBottom: 30 }}>
										Sign & Official stamp
									</Text>
								)}
							</View>

							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									marginTop: 10,
								}}
							>
								<Text style={{ width: 40, fontSize: 9 }}>Date</Text>
								<Text style={{ fontSize: 9 }}>
									{providerDate ? formatDate(providerDate) : formattedDate}
								</Text>
							</View>
						</View>
					</View>
				</View>

				{/* Payment Methods */}
				<View style={invoiceStyles.paymentRow}>
					<Text style={{ fontSize: 9 }}>Method of Payment:</Text>
					<View style={{ flexDirection: "row", alignItems: "center" }}>
						<Text style={{ fontSize: 9, marginLeft: 20 }}>
							Electric Fund Transfer (EFT)
						</Text>
						<View style={invoiceStyles.checkbox} />
					</View>
					<View style={{ flexDirection: "row", alignItems: "center" }}>
						<Text style={{ fontSize: 9, marginLeft: 20 }}>Vote Transfer</Text>
						<View style={invoiceStyles.checkbox} />
					</View>
					<View style={{ flexDirection: "row", alignItems: "center" }}>
						<Text style={{ fontSize: 9, marginLeft: 20 }}>
							Local Order (LO)
						</Text>
						<View style={invoiceStyles.checkbox} />
					</View>
				</View>

				{/* Checklist */}
				<View>
					<Text style={invoiceStyles.grayBoxHeader}>CHECK LIST</Text>
					<View style={invoiceStyles.checklistBody}>
						<View style={invoiceStyles.checkItem}>
							<Text style={{ width: 25, fontSize: 9 }}>xix)</Text>
							<Text style={invoiceStyles.checkLabel}>
								Company registration by MJIIT(UTM) has been completed: (please
								include proof that registration has been completed or is not
								required, either via email or WhatsApp)
							</Text>
							<View style={invoiceStyles.checkOptions}>
								<View style={invoiceStyles.smallCheck} />
								<Text style={invoiceStyles.smallCheckLabel}>Yes</Text>
								<View style={invoiceStyles.smallCheck} />
								<Text style={invoiceStyles.smallCheckLabel}>No</Text>
								<View style={invoiceStyles.smallCheck} />
								<Text style={invoiceStyles.smallCheckLabel}>N/A</Text>
							</View>
						</View>

						<View style={invoiceStyles.checkItem}>
							<Text style={{ width: 25, fontSize: 9 }}>xx)</Text>
							<Text style={invoiceStyles.checkLabel}>
								The quotation has been accepted by the customer:
							</Text>
							<View style={invoiceStyles.checkOptions}>
								<View style={invoiceStyles.smallCheck} />
								<Text style={invoiceStyles.smallCheckLabel}>Yes</Text>
								<View style={invoiceStyles.smallCheck} />
								<Text style={invoiceStyles.smallCheckLabel}>No</Text>
								<View style={invoiceStyles.smallCheck} />
								<Text style={invoiceStyles.smallCheckLabel}>N/A</Text>
							</View>
						</View>

						<View style={invoiceStyles.checkItem}>
							<Text style={{ width: 25, fontSize: 9 }}>xxi)</Text>
							<Text style={invoiceStyles.checkLabel}>
								A Purchase Order(PO) or a Local Order(LO) has been given by the
								customer: (please attach PO or LO documents)
							</Text>
							<View style={invoiceStyles.checkOptions}>
								<View style={invoiceStyles.smallCheck} />
								<Text style={invoiceStyles.smallCheckLabel}>Yes</Text>
								<View style={invoiceStyles.smallCheck} />
								<Text style={invoiceStyles.smallCheckLabel}>No</Text>
								<View style={invoiceStyles.smallCheck} />
								<Text style={invoiceStyles.smallCheckLabel}>N/A</Text>
							</View>
						</View>
					</View>
				</View>

				{/* Declaration */}
				<View>
					<Text style={invoiceStyles.grayBoxHeader}>DECLARATION</Text>
					<View style={invoiceStyles.declarationBody}>
						<Text
							style={{
								fontSize: 10,
								textAlign: "center",
								marginBottom: 15,
								fontStyle: "italic",
							}}
						>
							As a billing PIC, I will claim my client's debt until it is
							settled.
						</Text>

						<View
							style={{
								flexDirection: "row",
								alignItems: "flex-end",
								marginBottom: 5,
							}}
						>
							<Text style={{ width: 120, fontSize: 9 }}>Name :</Text>
							<View style={invoiceStyles.sigLine} />
						</View>
						<View
							style={{
								flexDirection: "row",
								alignItems: "flex-end",
								marginBottom: 5,
							}}
						>
							<Text style={{ width: 120, fontSize: 9 }}>
								Sign & Official Stamps :
							</Text>
							<View style={invoiceStyles.sigLine} />
						</View>
						<View style={{ flexDirection: "row", alignItems: "flex-end" }}>
							<Text style={{ width: 120, fontSize: 9 }}>Date :</Text>
							<Text style={{ marginLeft: 5, fontSize: 9 }}>
								{formattedDate}
							</Text>
							<View style={invoiceStyles.sigLine} />
						</View>
					</View>
				</View>
			</Page>
		</Document>
	);
}

// TORTemplate wrapper component that maps route props to InvoiceRequestForm
export function TORTemplate({
	userName,
	userEmail,
	userFaculty,
	userDepartment,
	userIkohza,
	utmLocation,
	supervisorName = "",
	refNo,
	date,
	userAddress = "",
	userTel = "",
	serviceItems = [],
	userType,
	facilityName,
	staffPicName,
	staffPicEmail,
	staffPicFullName,
	staffPicSignatureImageUrl,
}: TORTemplateProps) {
	// Map service items to line items format
	const items: LineItem[] = serviceItems.map((item) => ({
		description: item.sampleName
			? `${item.service.name} - ${item.sampleName}`
			: item.service.name,
		quantity: item.quantity,
		unitCharge:
			typeof item.unitPrice === "string"
				? parseFloat(item.unitPrice)
				: Number(item.unitPrice),
		unit: item.unit,
	}));

	// Generate address based on user type
	const generatedAddress = userType
		? generateTORAddress({
			userType,
			userAddress,
			department: userDepartment,
			faculty: userFaculty,
			ikohza: userIkohza,
			utmLocation,
		})
		: userAddress || "N/A";

	// Use InvoiceRequestForm with mapped props
	return (
		<InvoiceRequestForm
			address={generatedAddress || "N/A"}
			date={date}
			email={userEmail}
			facility={facilityName}
			items={items}
			name={userName}
			providerName={staffPicFullName}
			refNo={refNo}
			staffPic={staffPicName}
			staffPicEmail={staffPicEmail}
			staffPicSignatureImageUrl={staffPicSignatureImageUrl}
			supervisorName={supervisorName}
			tel={userTel || "N/A"}
		/>
	);
}
