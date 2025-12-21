/**
 * Facility Document Configuration
 * Centralized default configuration for PDF templates and facility information
 *
 * NOTE: This is a fallback/default configuration. Runtime overrides come from
 * the FacilityDocumentConfig database model (see @/entities/document-config).
 * Administrators can update facility settings via the Admin Settings page,
 * which will be used in PDF generation and service forms.
 *
 * This file serves as the default/fallback when no database settings exist.
 */

export const facilityDocumentConfig = {
	// Facility Information
	facilityName: "ChECA iKohza",

	// Facility Address
	address: {
		title: "ChECA iKohza",
		institute: "Malaysia-Japan International Institute of Technology (MJIIT)",
		university: "Universiti Teknologi Malaysia",
		street: "Jalan Sultan Yahya Petra",
		city: "54100 Kuala Lumpur Malaysia",
		email: "checa.mjiit@utm.my",
	},

	// Staff PIC (Person In Charge) Information
	staffPic: {
		name: "Eleen Dayana",
		fullName: "Eleen Dayana Mohamed Isa",
		email: "eleendayana@utm.my",
		phone: null as string | null,
		title: null as string | null,
		signatureBlobId: null as string | null,
		signatureImageUrl: null as string | null,
	},

	// Ikohza Head Information
	ikohzaHead: {
		name: "ASSOC. PROF. DR ROSHAFIMA RASIT ALI",
		title: null as string | null,
		department: "Department of Chemical and Environmental Engineering (ChEE)",
		institute: "Malaysia – Japan International Institute of Technology (MJIIT)",
		university: "Universiti Teknologi Malaysia Kuala Lumpur",
		address: "Jalan Sultan Yahya Petra,54100 Kuala Lumpur Malaysia",
		signatureBlobId: null as string | null,
		signatureImageUrl: null as string | null,
	},

	// Logo paths (stored in repo, not in DB)
	logos: {
		// NOTE: Image files are stored under public/images
		// Both main and big currently use the same CheCA logo asset
		main: "checa-logo.jpeg",
		big: "checa-logo.jpeg",
	},

	// CC Recipients
	ccRecipients: ["Eleen Dayana Mohamed Isa", "Siti Husnaa Mohd Taib"] as const,

	// Facilities list
	facilities: [
		"Oven",
		"Hot plate stirrer",
		"Centrifuge",
		"pH meter",
		"Rotary evaporator",
		"Bath sonicator",
		"Refrigerator",
		"Furnace",
		"Homogenizer",
		"Water bath",
		"Overhead stirrer",
		"Deionized water",
		"Weighing balance",
		"Fume hood",
		"Deep freezer",
		"Glassware",
	] as const,
} as const;
