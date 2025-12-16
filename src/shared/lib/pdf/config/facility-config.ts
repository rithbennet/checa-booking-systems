/**
 * Facility Configuration
 * Centralized configuration for PDF templates and facility information
 * Update these values to change facility details across all PDF documents
 */

export const facilityConfig = {
	// Facility Information
	facilityName: "ChECA iKohza",

	// Staff PIC (Person In Charge) Information
	staffPic: {
		name: "Eleen Dayana",
		email: "eleendayana@utm.my",
		fullName: "Eleen Dayana Mohamed Isa",
	},

	// Work Area Template Configuration
	workArea: {
		// Signature Information
		signature: {
			name: "ASSOC. PROF. DR ROSHAFIMA RASIT ALI",
			department: "Department of Chemical and Environmental Engineering (ChEE)",
			institute:
				"Malaysia – Japan International Institute of Technology (MJIIT)",
			university: "Universiti Teknologi Malaysia Kuala Lumpur",
			address: "Jalan Sultan Yahya Petra,54100 Kuala Lumpur Malaysia",
			signatureImage: "signature-roshafima.png",
		},
		// CC Recipients
		ccRecipients: ["Eleen Dayana Mohamed Isa", "Siti Husnaa Mohd Taib"],
		// Address Information
		address: {
			title: "ChECA iKohza",
			institute: "Malaysia-Japan International Institute of Technology (MJIIT)",
			university: "Universiti Teknologi Malaysia",
			street: "Jalan Sultan Yahya Petra",
			city: "54100 Kuala Lumpur Malaysia",
			email: "checa.mjiit@utm.my",
		},
		// Logo paths
		logos: {
			main: "checa-logo.png",
			big: "checa-logo-big.png",
		},
	},
} as const;
