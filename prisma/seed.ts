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
		"utm.member@utm.my",
		"external@example.com",
	];

	try {
		await db.user.deleteMany({
			where: { email: { in: seedEmails } },
		});

		await db.betterAuthUser.deleteMany({
			where: { email: { in: seedEmails } },
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
				staffId: "ADM001",
				faculty: "Faculty of Engineering",
				department: "ChECA Lab",
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
				staffId: "LAB001",
				faculty: "Faculty of Engineering",
				department: "ChECA Lab",
				phone: "+60123456789",
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
				matrixNo: "MKE201234",
				faculty: "Faculty of Engineering",
				department: "Chemical Engineering",
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
				companyName: "PETRONAS Research Sdn Bhd",
				address:
					"Lot 3288 & 3289, Off Jalan Ayer Itam, Kawasan Institusi Bangi, 43000 Kajang, Selangor",
				phone: "+60387654321",
				emailVerifiedAt: new Date(),
				approvedAt: new Date(),
			},
		},
	];

	let adminUser: { id: string } | null = null;

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
			console.error(`Full result for ${user.email}:`, JSON.stringify(result, null, 2));
			throw new Error(
				`Failed to create ${user.email}: ${errorDetails}`
			);
		}
		
		console.log(`✅ Created Better Auth user: ${user.email} (ID: ${result.user.id})`);

		// Mark email as verified
		await db.betterAuthUser.update({
			where: { email: user.email },
			data: { emailVerified: true },
		});

		// Create our User record
		const createdUser = await db.user.create({
			data: {
				...user.userData,
				email: user.email,
				approvedBy: user.userData.approvedBy ?? adminUser?.id ?? null,
			},
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

