// @ts-nocheck
/* eslint-disable */

import { PrismaClient } from "../generated/prisma";
import { auth } from "../src/shared/server/better-auth/config";

const db = new PrismaClient();

/**
 * Seed dummy accounts for development
 * Uses Better Auth's API directly to create users with correctly hashed passwords
 */
async function main() {
	console.log("🌱 Seeding database...");

	// Clean up existing seed data
	const seedEmails = [
		"admin@checa.utm.my",
		"labadmin@checa.utm.my",
		"ikohza@checa.utm.my",
		"utm.member@utm.my",
		"external@example.com",
	];

	try {
		// Clean up by email first (for existing data)
		// Note: We'll primarily use authUserId for linking going forward
		const existingUsers = await db.user.findMany({
			where: { email: { in: seedEmails } },
			select: { authUserId: true },
		});

		const authUserIds = existingUsers
			.map((u) => u.authUserId)
			.filter(Boolean) as string[];

		await db.user.deleteMany({
			where: { email: { in: seedEmails } },
		});

		await db.betterAuthUser.deleteMany({
			where: {
				OR: [
					{ email: { in: seedEmails } },
					...(authUserIds.length > 0 ? [{ id: { in: authUserIds } }] : []),
				],
			},
		});
	} catch (error) {
		// If tables don't exist, that's okay - we'll create them
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "P2021"
		) {
			console.log(
				"⚠️  Tables don't exist yet. Please run 'pnpm db:push' first.",
			);
			throw error;
		}
		throw error;
	}

	// Seed Academic Organizations
	console.log("\n🌱 Seeding academic organizations...");

	// Clean up existing academic organizations
	await db.ikohza.deleteMany({});
	await db.department.deleteMany({});
	await db.faculty.deleteMany({});

	// Create MJIIT (Malaysian-Japan Institute of Technology) - Only MJIIT has iKohza
	const mjiitFaculty = await db.faculty.create({
		data: {
			code: "MJIIT",
			name: "Malaysia-Japan International Institute of Technology",
			isActive: true,
		},
	});

	console.log(`✅ Created faculty: ${mjiitFaculty.name}`);

	// Create Faculty of Engineering (regular UTM faculty)
	const engineeringFaculty = await db.faculty.create({
		data: {
			code: "FKE",
			name: "Faculty of Engineering",
			isActive: true,
		},
	});

	console.log(`✅ Created faculty: ${engineeringFaculty.name}`);

	// Create Departments under Faculty of Engineering (regular)
	const chemEngDept = await db.department.create({
		data: {
			facultyId: engineeringFaculty.id,
			code: "JKK",
			name: "Department of Chemical Engineering",
			isActive: true,
		},
	});

	const mechanicalDept = await db.department.create({
		data: {
			facultyId: engineeringFaculty.id,
			code: "JKM",
			name: "Department of Mechanical Engineering",
			isActive: true,
		},
	});

	console.log(`✅ Created department: ${chemEngDept.name}`);
	console.log(`✅ Created department: ${mechanicalDept.name}`);

	// Create Departments under MJIIT
	const mjiitChemEngDept = await db.department.create({
		data: {
			facultyId: mjiitFaculty.id,
			code: "MJIIT-CHE",
			name: "MJIIT Chemical Engineering Department",
			isActive: true,
		},
	});

	console.log(`✅ Created department: ${mjiitChemEngDept.name}`);

	// Create iKohza (only under MJIIT faculty)
	const checaIkohza = await db.ikohza.create({
		data: {
			facultyId: mjiitFaculty.id,
			code: "CHECA",
			name: "ChECA iKohza",
			description: "Chemical Engineering Characterization & Analysis",
			isActive: true,
		},
	});

	const materialIkohza = await db.ikohza.create({
		data: {
			facultyId: mjiitFaculty.id,
			code: "MAT",
			name: "Advanced Materials iKohza",
			description: "Advanced Materials Research",
			isActive: true,
		},
	});

	console.log(`✅ Created iKohza: ${checaIkohza.name} (MJIIT only)`);
	console.log(`✅ Created iKohza: ${materialIkohza.name} (MJIIT only)`);

	// Seed External Organizations
	console.log("\n🌱 Seeding external organizations...");

	// Clean up existing external organizations
	await db.companyBranch.deleteMany({});
	await db.company.deleteMany({});

	// Create Companies
	const petronas = await db.company.create({
		data: {
			name: "PETRONAS Research Sdn Bhd",
			legalName: "PETRONAS Research Sdn. Bhd.",
			regNo: "123456-A",
			isActive: true,
		},
	});

	const topGlove = await db.company.create({
		data: {
			name: "Top Glove Corporation",
			legalName: "Top Glove Corporation Bhd",
			regNo: "199801018294",
			isActive: true,
		},
	});

	console.log(`✅ Created company: ${petronas.name}`);
	console.log(`✅ Created company: ${topGlove.name}`);

	// Create Company Branches
	const petronasHQ = await db.companyBranch.create({
		data: {
			companyId: petronas.id,
			name: "Headquarters",
			address: "Lot 3288 & 3289, Off Jalan Ayer Itam, Kawasan Institusi Bangi",
			city: "Kajang",
			state: "Selangor",
			postcode: "43000",
			country: "Malaysia",
			phone: "+60387654321",
			isActive: true,
		},
	});

	const topGloveJohor = await db.companyBranch.create({
		data: {
			companyId: topGlove.id,
			name: "Johor Branch",
			address: "PTD 167551, Jalan Budi 8, Taman Bukit Mulia",
			city: "Johor Bahru",
			state: "Johor",
			postcode: "81300",
			country: "Malaysia",
			phone: "+60123456789",
			isActive: true,
		},
	});

	console.log(`✅ Created branch: ${petronasHQ.name} for ${petronas.name}`);
	console.log(`✅ Created branch: ${topGloveJohor.name} for ${topGlove.name}`);

	const password = "Password123!";

	// Create users using Better Auth's API (this will hash passwords correctly)
	const users = [
		{
			email: "admin@checa.utm.my",
			password,
			name: "Admin User",
			userData: {
				firstName: "Admin",
				lastName: "User",
				userType: "lab_administrator" as const,
				status: "active" as const,
				academicType: "staff" as const,
				userIdentifier: "ADM001",
				facultyId: mjiitFaculty.id,
				departmentId: mjiitChemEngDept.id,
				ikohzaId: checaIkohza.id,
				// legacy plain-text fields removed; using relational IDs instead
				UTM: "kuala_lumpur" as const,
				emailVerifiedAt: new Date(),
				approvedAt: new Date(),
				approvedBy: null,
			},
		},
		{
			email: "labadmin@checa.utm.my",
			password,
			name: "Lab Admin User",
			userData: {
				firstName: "Lab",
				lastName: "Administrator",
				userType: "lab_administrator" as const,
				status: "active" as const,
				academicType: "staff" as const,
				userIdentifier: "LAB001",
				facultyId: mjiitFaculty.id,
				departmentId: mjiitChemEngDept.id,
				ikohzaId: checaIkohza.id,
				// legacy plain-text fields removed; using relational IDs instead
				UTM: "kuala_lumpur" as const,
				phone: "+60123456789",
				emailVerifiedAt: new Date(),
				approvedAt: new Date(),
			},
		},
		{
			email: "ikohza@checa.utm.my",
			password,
			name: "ChECA iKohza",
			userData: {
				firstName: "ChECA",
				lastName: "iKohza",
				userType: "mjiit_member" as const,
				status: "active" as const,
				academicType: "staff" as const,
				userIdentifier: "IKH001",
				facultyId: mjiitFaculty.id,
				departmentId: mjiitChemEngDept.id,
				ikohzaId: checaIkohza.id,
				// legacy plain-text fields removed; using relational IDs instead
				UTM: "kuala_lumpur" as const,
				emailVerifiedAt: new Date(),
				approvedAt: new Date(),
			},
		},
		{
			email: "utm.member@utm.my",
			password,
			name: "UTM Member",
			userData: {
				firstName: "Ahmad",
				lastName: "Faiz",
				userType: "utm_member" as const,
				status: "active" as const,
				academicType: "student" as const,
				userIdentifier: "MKE201234",
				supervisorName: "Dr. Siti Aminah",
				facultyId: engineeringFaculty.id,
				departmentId: chemEngDept.id,

				UTM: "johor_bahru" as const,
				phone: "+60123456789",
				emailVerifiedAt: new Date(),
				approvedAt: new Date(),
			},
		},
		{
			email: "external@example.com",
			password,
			name: "External Member",
			userData: {
				firstName: "Michael",
				lastName: "Johnson",
				userType: "external_member" as const,
				status: "active" as const,
				academicType: "none" as const,
				companyId: petronas.id,
				companyBranchId: petronasHQ.id,
				// legacy plain-text fields removed; using relational IDs instead
				address:
					"Lot 3288 & 3289, Off Jalan Ayer Itam, Kawasan Institusi Bangi, 43000 Kajang, Selangor",
				phone: "+60387654321",
				emailVerifiedAt: new Date(),
				approvedAt: new Date(),
			},
		},
	];

	let adminUser: { id: string } | null = null;
	/**
	 * Track User → BetterAuthUser ID links for verification
	 * KEY CHANGE: We now store authUserId directly, removing the email-based
	 * join dependency. This prevents issues if users change their email later.
	 */
	const userAuthLinks: Array<{
		email: string;
		userId: string;
		authUserId: string;
	}> = [];

	for (const user of users) {
		console.log(`Creating ${user.email}...`);

		// Use Better Auth's signUpEmail API directly
		const result = await auth.api.signUpEmail({
			body: {
				email: user.email,
				password: user.password,
				name: user.name,
			},
		});

		// Better Auth's signUpEmail returns { token, user } directly, not wrapped in data
		if (!result.user) {
			const errorDetails = result.error
				? JSON.stringify(result.error, null, 2)
				: JSON.stringify(result, null, 2);
			console.error(
				`Full result for ${user.email}:`,
				JSON.stringify(result, null, 2),
			);
			throw new Error(`Failed to create ${user.email}: ${errorDetails}`);
		}

		const betterAuthUserId = result.user.id;
		console.log(
			`✅ Created Better Auth user: ${user.email} (ID: ${betterAuthUserId})`,
		);

		// Mark email as verified
		await db.betterAuthUser.update({
			where: { id: betterAuthUserId },
			data: { emailVerified: true },
		});

		// KEY CHANGE: Create User record with direct authUserId linking
		// This ensures permanent ID-based relationship, not email-based
		const createdUser = await db.user.create({
			data: {
				...user.userData,
				email: user.email,
				authUserId: betterAuthUserId, // Direct ID link to BetterAuthUser
				approvedBy: user.userData.approvedBy ?? adminUser?.id ?? null,
			},
		});

		// Track the link for verification output
		userAuthLinks.push({
			email: user.email,
			userId: createdUser.id,
			authUserId: betterAuthUserId,
		});

		if (!adminUser && user.email === "admin@checa.utm.my") {
			adminUser = { id: createdUser.id };
		}
	}

	// Update approvedBy for non-admin users
	if (adminUser) {
		await db.user.updateMany({
			where: {
				email: {
					in: [
						"labadmin@checa.utm.my",
						"utm.member@utm.my",
						"external@example.com",
					],
				},
				approvedBy: null,
			},
			data: { approvedBy: adminUser.id },
		});
	}

	// Seed Services
	console.log("\n🌱 Seeding services...");

	// Clean up existing services
	await db.servicePricing.deleteMany({});
	await db.service.deleteMany({});

	const services = [
		{
			code: "FTIR-ATR-001",
			name: "FTIR Spectroscopy - ATR",
			category: "ftir_atr" as const,
			description:
				"Fourier Transform Infrared Spectroscopy with Attenuated Total Reflectance for surface analysis",
			requiresSample: true,
			pricing: [
				{ userType: "mjiit_member" as const, price: 50, unit: "per sample" },
				{ userType: "utm_member" as const, price: 60, unit: "per sample" },
				{
					userType: "external_member" as const,
					price: 80,
					unit: "per sample",
				},
			],
		},
		{
			code: "FTIR-KBr-001",
			name: "FTIR Spectroscopy - KBr",
			category: "ftir_kbr" as const,
			description:
				"Fourier Transform Infrared Spectroscopy with KBr pellet method for bulk analysis",
			requiresSample: true,
			pricing: [
				{ userType: "mjiit_member" as const, price: 55, unit: "per sample" },
				{ userType: "utm_member" as const, price: 65, unit: "per sample" },
				{
					userType: "external_member" as const,
					price: 90,
					unit: "per sample",
				},
			],
		},
		{
			code: "UV-VIS-ABS-001",
			name: "UV-Vis Spectroscopy - Absorbance/Transmittance",
			category: "uv_vis_absorbance" as const,
			description:
				"UV-Visible spectroscopy for absorbance and transmittance measurements",
			requiresSample: true,
			pricing: [
				{ userType: "mjiit_member" as const, price: 20, unit: "per sample" },
				{ userType: "utm_member" as const, price: 30, unit: "per sample" },
				{
					userType: "external_member" as const,
					price: 50,
					unit: "per sample",
				},
			],
		},
		{
			code: "UV-VIS-REF-001",
			name: "UV-Vis Spectroscopy - Reflectance",
			category: "uv_vis_reflectance" as const,
			description: "UV-Visible spectroscopy for reflectance measurements",
			requiresSample: true,
			pricing: [
				{ userType: "mjiit_member" as const, price: 25, unit: "per sample" },
				{ userType: "utm_member" as const, price: 35, unit: "per sample" },
				{
					userType: "external_member" as const,
					price: 55,
					unit: "per sample",
				},
			],
		},
		{
			code: "BET-001",
			name: "Surface Area and Pore Analyzer (BET)",
			category: "bet_analysis" as const,
			description:
				"BET surface area and pore size analysis for material characterization",
			requiresSample: true,
			pricing: [
				{ userType: "mjiit_member" as const, price: 190, unit: "per sample" },
				{ userType: "utm_member" as const, price: 210, unit: "per sample" },
				{
					userType: "external_member" as const,
					price: 250,
					unit: "per sample",
				},
			],
		},
		{
			code: "HPLC-PAD-001",
			name: "HPLC-Photodiode Array Detection",
			category: "hplc_pda" as const,
			description:
				"High-performance liquid chromatography with photodiode array detection for compound identification and quantification",
			requiresSample: true,
			pricing: [
				{ userType: "mjiit_member" as const, price: 65, unit: "per sample" },
				{ userType: "utm_member" as const, price: 95, unit: "per sample" },
				{
					userType: "external_member" as const,
					price: 170,
					unit: "per sample",
				},
			],
		},
		{
			code: "WORK-001",
			name: "Working Area (Bench fees)",
			category: "working_space" as const,
			description:
				"Lab bench rental with basic equipment access for research work",
			requiresSample: false,
			operatingHours: "Monday - Friday, 8:00 AM - 5:00 PM",
			pricing: [
				{
					userType: "mjiit_member" as const,
					price: 150,
					unit: "per person per month",
				},
				{
					userType: "utm_member" as const,
					price: 200,
					unit: "per person per month",
				},
				{
					userType: "external_member" as const,
					price: 300,
					unit: "per person per month",
				},
			],
		},
		{
			code: "HPLC-MAINT-001",
			name: "HPLC System Maintenance",
			category: "hplc_pda" as const,
			description:
				"HPLC system temporarily unavailable while maintenance is in progress.",
			requiresSample: true,
			isActive: false,
			pricing: [
				{ userType: "mjiit_member" as const, price: 65, unit: "per sample" },
				{ userType: "utm_member" as const, price: 95, unit: "per sample" },
				{
					userType: "external_member" as const,
					price: 170,
					unit: "per sample",
				},
			],
		},
	];

	const createdServices: Record<string, { id: string; code: string }> = {};

	for (const serviceData of services) {
		const { pricing, ...serviceFields } = serviceData;
		const service = await db.service.create({
			data: serviceFields,
		});

		createdServices[service.code] = { id: service.id, code: service.code };

		for (const priceData of pricing) {
			await db.servicePricing.create({
				data: {
					serviceId: service.id,
					...priceData,
					effectiveFrom: new Date(),
				},
			});
		}

		console.log(`✅ Created service: ${service.name} (${service.code})`);
	}

	// Seed Equipment
	console.log("\n🌱 Seeding equipment...");

	await db.workspaceEquipmentUsage.deleteMany({});
	await db.sampleEquipmentUsage.deleteMany({});
	await db.labEquipment.deleteMany({});

	const equipmentList = [
		{
			name: "FTIR Spectrometer",
			description:
				"Bruker Vertex 70 FTIR system for material characterization.",
		},
		{
			name: "BET Surface Analyzer",
			description: "Micromeritics ASAP 2020 analyzer for BET measurements.",
		},
		{
			name: "HPLC System",
			description:
				"Agilent Infinity II system currently undergoing maintenance.",
			isAvailable: false,
			maintenanceNotes: "Scheduled maintenance until next week.",
		},
	];

	for (const equipment of equipmentList) {
		await db.labEquipment.create({
			data: equipment,
		});
		console.log(`✅ Created equipment: ${equipment.name}`);
	}

	// Seed Add-Ons
	console.log("\n🌱 Seeding add-ons...");

	// Clean up existing add-ons
	await db.serviceAddOn.deleteMany({});
	await db.serviceAddOnMapping.deleteMany({});
	await db.globalAddOnCatalog.deleteMany({});

	// Create global add-ons
	const hplcPrep = await db.globalAddOnCatalog.create({
		data: {
			name: "HPLC Sample Preparation",
			description: "Optional sample prep before analysis for extra RM 20 fee.",
			defaultAmount: 20.0,
			applicableTo: "sample",
		},
	});

	const rushProc = await db.globalAddOnCatalog.create({
		data: {
			name: "Rush Processing",
			description: "Priority queue for faster lab results.",
			defaultAmount: 50.0,
			applicableTo: "both",
		},
	});

	const extraHours = await db.globalAddOnCatalog.create({
		data: {
			name: "Extended Lab Hours",
			description: "Use lab beyond normal working hours.",
			defaultAmount: 40.0,
			applicableTo: "workspace",
		},
	});

	console.log(`✅ Created add-on: ${hplcPrep.name}`);
	console.log(`✅ Created add-on: ${rushProc.name}`);
	console.log(`✅ Created add-on: ${extraHours.name}`);

	// Map add-ons to services
	const hplcService = createdServices["HPLC-PAD-001"];
	const workspaceService = createdServices["WORK-001"];

	if (hplcService) {
		await db.serviceAddOnMapping.create({
			data: {
				serviceId: hplcService.id,
				addOnId: hplcPrep.id,
				isEnabled: true,
				customAmount: 18.0, // discount example
			},
		});

		await db.serviceAddOnMapping.create({
			data: {
				serviceId: hplcService.id,
				addOnId: rushProc.id,
				isEnabled: true,
			},
		});

		console.log(`✅ Mapped add-ons to HPLC service`);
	}

	if (workspaceService) {
		await db.serviceAddOnMapping.create({
			data: {
				serviceId: workspaceService.id,
				addOnId: extraHours.id,
				isEnabled: true,
			},
		});

		await db.serviceAddOnMapping.create({
			data: {
				serviceId: workspaceService.id,
				addOnId: rushProc.id,
				isEnabled: true,
			},
		});

		console.log(`✅ Mapped add-ons to Workspace service`);
	}

	// Verification: Print User → BetterAuthUser linkage
	console.log("\n✅ Linked User → BetterAuthUser");
	console.log("─────────────────────────────────────────────────────");
	console.log(
		"Email                        | User ID (first 8) | Auth ID (first 8)",
	);
	console.log("─────────────────────────────────────────────────────");
	for (const link of userAuthLinks) {
		const userIdPrefix = link.userId.substring(0, 8);
		const authIdPrefix = link.authUserId.substring(0, 8);
		console.log(
			`${link.email.padEnd(28)} | ${userIdPrefix.padEnd(17)} | ${authIdPrefix}`,
		);
	}
	console.log("─────────────────────────────────────────────────────");

	console.log("✅ Seed completed successfully!");
	console.log("\n📋 Account Credentials:");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("Lab Administrator (Admin):");
	console.log("  Email: admin@checa.utm.my");
	console.log("  Password: Password123!");
	console.log("\nLab Administrator (Lab Admin):");
	console.log("  Email: labadmin@checa.utm.my");
	console.log("  Password: Password123!");
	console.log("\nUTM Member:");
	console.log("  Email: utm.member@utm.my");
	console.log("  Password: Password123!");
	console.log("\nExternal Member:");
	console.log("  Email: external@example.com");
	console.log("  Password: Password123!");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
	.catch((e) => {
		console.error("❌ Seed failed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await db.$disconnect();
	});
