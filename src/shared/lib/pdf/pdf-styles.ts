/**
 * PDF Styles and Fonts Configuration
 * Shared styles for all PDF templates in the ChECA Lab Operations System
 */

import { Font, StyleSheet } from "@react-pdf/renderer";

// Register standard fonts
Font.register({
	family: "Helvetica",
	fonts: [
		{ src: "Helvetica" },
		{ src: "Helvetica-Bold", fontWeight: 700 },
		{ src: "Helvetica-Oblique", fontStyle: "italic" },
		{ src: "Helvetica-BoldOblique", fontWeight: 700, fontStyle: "italic" },
	],
});

Font.register({
	family: "Times-Roman",
	fonts: [
		{ src: "Times-Roman" },
		{ src: "Times-Bold", fontWeight: 700 },
		{ src: "Times-Italic", fontStyle: "italic" },
		{ src: "Times-BoldItalic", fontWeight: 700, fontStyle: "italic" },
	],
});

// Colors for consistent styling
export const pdfColors = {
	primary: "#1e3a5f", // Dark blue for headers
	secondary: "#4a5568", // Gray for secondary text
	accent: "#2563eb", // Blue for links/accents
	border: "#d1d5db", // Light gray border
	lightBg: "#f3f4f6", // Light background
	success: "#16a34a", // Green
	warning: "#ca8a04", // Yellow/amber
	error: "#dc2626", // Red
	white: "#ffffff",
	black: "#000000",
};

// Create shared styles
export const styles = StyleSheet.create({
	// Page styles
	page: {
		fontFamily: "Helvetica",
		fontSize: 10,
		paddingTop: 40,
		paddingBottom: 60,
		paddingHorizontal: 40,
		backgroundColor: pdfColors.white,
	},
	pageWithFooter: {
		fontFamily: "Helvetica",
		fontSize: 10,
		paddingTop: 40,
		paddingBottom: 80,
		paddingHorizontal: 40,
		backgroundColor: pdfColors.white,
	},

	// Header styles
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
		flexDirection: "column",
		alignItems: "flex-start",
	},
	headerRight: {
		flexDirection: "column",
		alignItems: "flex-end",
		textAlign: "right",
	},
	headerCenter: {
		flexDirection: "column",
		alignItems: "center",
		textAlign: "center",
		flex: 1,
	},
	logo: {
		width: 120,
		height: 50,
		objectFit: "contain",
	},
	logoSmall: {
		width: 80,
		height: 35,
		objectFit: "contain",
	},

	// Title styles
	title: {
		fontSize: 18,
		fontWeight: 700,
		color: pdfColors.primary,
		marginBottom: 10,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 14,
		fontWeight: 700,
		color: pdfColors.secondary,
		marginBottom: 8,
	},
	sectionTitle: {
		fontSize: 12,
		fontWeight: 700,
		color: pdfColors.primary,
		marginTop: 15,
		marginBottom: 8,
		paddingBottom: 4,
		borderBottomWidth: 1,
		borderBottomColor: pdfColors.border,
	},

	// Text styles
	text: {
		fontSize: 10,
		lineHeight: 1.5,
		color: pdfColors.black,
	},
	textSmall: {
		fontSize: 8,
		lineHeight: 1.4,
		color: pdfColors.secondary,
	},
	textBold: {
		fontWeight: 700,
	},
	textItalic: {
		fontStyle: "italic",
	},
	textCenter: {
		textAlign: "center",
	},
	textRight: {
		textAlign: "right",
	},
	textUnderline: {
		textDecoration: "underline",
	},

	// Layout styles
	row: {
		flexDirection: "row",
	},
	column: {
		flexDirection: "column",
	},
	spaceBetween: {
		justifyContent: "space-between",
	},
	alignCenter: {
		alignItems: "center",
	},
	flex1: {
		flex: 1,
	},
	flex2: {
		flex: 2,
	},

	// Spacing
	mb4: { marginBottom: 4 },
	mb8: { marginBottom: 8 },
	mb12: { marginBottom: 12 },
	mb16: { marginBottom: 16 },
	mb20: { marginBottom: 20 },
	mb24: { marginBottom: 24 },
	mt8: { marginTop: 8 },
	mt12: { marginTop: 12 },
	mt16: { marginTop: 16 },
	mt20: { marginTop: 20 },
	p8: { padding: 8 },
	p12: { padding: 12 },

	// Table styles
	table: {
		flexDirection: "column",
		borderTopWidth: 1,
		borderLeftWidth: 1,
		borderColor: pdfColors.border,
		marginVertical: 10,
	},
	tableRow: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderColor: pdfColors.border,
	},
	tableRowHeader: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderColor: pdfColors.border,
		backgroundColor: pdfColors.primary,
	},
	tableRowAlt: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderColor: pdfColors.border,
		backgroundColor: pdfColors.lightBg,
	},
	tableCol: {
		flexDirection: "column",
		borderRightWidth: 1,
		borderColor: pdfColors.border,
		padding: 6,
		justifyContent: "center",
	},
	tableColHeader: {
		flexDirection: "column",
		borderRightWidth: 1,
		borderColor: pdfColors.border,
		padding: 6,
		justifyContent: "center",
	},
	tableCellHeader: {
		fontSize: 9,
		fontWeight: 700,
		color: pdfColors.white,
		textAlign: "center",
	},
	tableCell: {
		fontSize: 9,
		color: pdfColors.black,
	},
	tableCellRight: {
		fontSize: 9,
		color: pdfColors.black,
		textAlign: "right",
	},
	tableCellCenter: {
		fontSize: 9,
		color: pdfColors.black,
		textAlign: "center",
	},

	// Info box/card styles
	infoBox: {
		padding: 12,
		backgroundColor: pdfColors.lightBg,
		borderWidth: 1,
		borderColor: pdfColors.border,
		borderRadius: 4,
		marginVertical: 10,
	},
	infoRow: {
		flexDirection: "row",
		marginBottom: 4,
	},
	infoLabel: {
		fontSize: 9,
		fontWeight: 700,
		color: pdfColors.secondary,
		width: 100,
	},
	infoValue: {
		fontSize: 9,
		color: pdfColors.black,
		flex: 1,
	},

	// Signature styles
	signatureBlock: {
		marginTop: 30,
		paddingTop: 20,
	},
	signatureRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 20,
	},
	signatureBox: {
		width: "45%",
		borderWidth: 1,
		borderColor: pdfColors.border,
		padding: 15,
	},
	signatureLine: {
		borderBottomWidth: 1,
		borderBottomColor: pdfColors.black,
		marginTop: 40,
		marginBottom: 5,
	},
	signatureLabel: {
		fontSize: 9,
		color: pdfColors.secondary,
		marginTop: 4,
	},

	// Footer styles
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
	pageNumber: {
		fontSize: 8,
		color: pdfColors.secondary,
	},

	// Letter styles
	letterDate: {
		textAlign: "right",
		marginBottom: 20,
	},
	letterRef: {
		marginBottom: 10,
	},
	letterBody: {
		lineHeight: 1.6,
	},
	letterSalutation: {
		marginTop: 20,
		marginBottom: 10,
	},
	letterSignOff: {
		marginTop: 30,
	},

	// List styles
	listItem: {
		flexDirection: "row",
		marginBottom: 4,
	},
	listBullet: {
		width: 15,
		fontSize: 10,
	},
	listContent: {
		flex: 1,
		fontSize: 10,
	},
	numberedList: {
		marginLeft: 10,
	},

	// Divider
	divider: {
		borderBottomWidth: 1,
		borderBottomColor: pdfColors.border,
		marginVertical: 15,
	},
	dividerThick: {
		borderBottomWidth: 2,
		borderBottomColor: pdfColors.primary,
		marginVertical: 15,
	},

	// Badge/status styles
	badge: {
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
		fontSize: 8,
		fontWeight: 700,
	},
	badgeSuccess: {
		backgroundColor: "#dcfce7",
		color: pdfColors.success,
	},
	badgeWarning: {
		backgroundColor: "#fef9c3",
		color: pdfColors.warning,
	},
	badgeError: {
		backgroundColor: "#fee2e2",
		color: pdfColors.error,
	},
});

// Table column width helpers
export const tableColWidths = {
	no: "8%",
	description: "40%",
	quantity: "12%",
	unitPrice: "20%",
	total: "20%",
};

// Currency formatter
export function formatCurrency(amount: number | string): string {
	const num = typeof amount === "string" ? Number.parseFloat(amount) : amount;
	return new Intl.NumberFormat("en-MY", {
		style: "currency",
		currency: "MYR",
		minimumFractionDigits: 2,
	}).format(num);
}

// Date formatter
export function formatDate(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString("en-MY", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
}

// Short date formatter
export function formatDateShort(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString("en-MY", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}
