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
        "⚠️  Tables don't exist yet. Please run 'pnpm db:push' first."
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
      console.error(
        `Full result for ${user.email}:`,
        JSON.stringify(result, null, 2)
      );
      throw new Error(`Failed to create ${user.email}: ${errorDetails}`);
    }

    console.log(
      `✅ Created Better Auth user: ${user.email} (ID: ${result.user.id})`
    );

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
