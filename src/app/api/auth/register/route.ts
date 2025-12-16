import { NextResponse } from "next/server";
import { sendUserWelcomeVerification } from "@/entities/notification/server";
import {
	lookupDepartmentById,
	lookupFacultyById,
	lookupIkohzaById,
} from "@/entities/user/server";
import { env } from "@/env";
import { auth } from "@/shared/server/better-auth/config";
import { db } from "@/shared/server/db";
import { ValidationError } from "@/shared/server/errors";

/**
 * Register a new user:
 * - creates a Better Auth user (unverified)
 * - creates an application User record (pending status)
 * - sends verification email
 */
export async function POST(request: Request) {
	let body: Record<string, unknown> | undefined;
	try {
		body = await request.json();
		const email = typeof body?.email === "string" ? body.email : undefined;
		const password =
			typeof body?.password === "string" ? body.password : undefined;
		const firstName =
			typeof body?.firstName === "string" ? body.firstName : undefined;
		const lastName =
			typeof body?.lastName === "string" ? body.lastName : undefined;
		const userType =
			typeof body?.userType === "string" ? body.userType : undefined;
		const phone = typeof body?.phone === "string" ? body.phone : undefined;
		// Institutional fields
		const facultyId =
			typeof body?.facultyId === "string" ? body.facultyId : undefined;
		const departmentId =
			typeof body?.departmentId === "string" ? body.departmentId : undefined;
		const ikohzaId =
			typeof body?.ikohzaId === "string" ? body.ikohzaId : undefined;
		const academicType =
			typeof body?.academicType === "string" ? body.academicType : undefined;
		const userIdentifier =
			typeof body?.userIdentifier === "string"
				? body.userIdentifier
				: undefined;
		const supervisorName =
			typeof body?.supervisorName === "string"
				? body.supervisorName
				: undefined;
		// External fields
		const companyId =
			typeof body?.companyId === "string" ? body.companyId : undefined;
		const companyBranchId =
			typeof body?.companyBranchId === "string"
				? body.companyBranchId
				: undefined;
		const newCompanyName =
			typeof body?.newCompanyName === "string"
				? body.newCompanyName
				: undefined;
		const newCompanyAddress =
			typeof body?.newCompanyAddress === "string"
				? body.newCompanyAddress
				: undefined;
		const newCompanyBranchName =
			typeof body?.newCompanyBranchName === "string"
				? body.newCompanyBranchName
				: undefined;
		const newBranchName =
			typeof body?.newBranchName === "string" ? body.newBranchName : undefined;
		const newBranchAddress =
			typeof body?.newBranchAddress === "string"
				? body.newBranchAddress
				: undefined;

		if (!email || !password || !firstName || !lastName || !userType || !phone) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		// 1. Create Better Auth user (email will NOT be verified yet)
		const signUpResult = await auth.api.signUpEmail({
			body: {
				email,
				password,
				name: `${firstName} ${lastName}`,
			},
		});

		// better-auth returns shapes like { token: string | null, user: {...} }
		if (!signUpResult || !signUpResult.user) {
			return NextResponse.json(
				{ error: "Failed to create user" },
				{ status: 400 },
			);
		}

		// 2. Look up faculty/department/ikohza for institutional users (before transaction)
		let dbFacultyId: string | undefined;
		let dbDepartmentId: string | undefined;
		let dbIkohzaId: string | undefined;
		let finalUserType = userType as
			| "utm_member"
			| "external_member"
			| "mjiit_member";

		if (
			(userType === "utm_member" || userType === "mjiit_member") &&
			facultyId
		) {
			// Look up faculty by ID
			const faculty = await lookupFacultyById(facultyId);
			if (!faculty) {
				return NextResponse.json(
					{
						error: "Invalid faculty",
						details: { facultyId: ["Faculty not found"] },
					},
					{ status: 400 },
				);
			}
			dbFacultyId = faculty.id;
			if (faculty.code.toUpperCase() === "MJIIT") {
				finalUserType = "mjiit_member";
			}

			// Look up department if provided
			if (departmentId && dbFacultyId) {
				const dept = await lookupDepartmentById(departmentId, dbFacultyId);
				if (!dept) {
					return NextResponse.json(
						{
							error: "Invalid department",
							details: { departmentId: ["Department not found"] },
						},
						{ status: 400 },
					);
				}
				dbDepartmentId = dept.id;
			}

			// Look up ikohza (required for MJIIT)
			if (dbFacultyId && faculty.code.toUpperCase() === "MJIIT") {
				// Require ikohzaId for MJIIT members
				if (!ikohzaId) {
					return NextResponse.json(
						{
							error: "iKohza selection is required for MJIIT members",
							details: { ikohzaId: ["iKohza is required"] },
						},
						{ status: 400 },
					);
				}

				// Validate ikohza exists
				const ikohza = await lookupIkohzaById(ikohzaId, dbFacultyId);
				if (!ikohza) {
					return NextResponse.json(
						{
							error: "Invalid iKohza",
							details: { ikohzaId: ["iKohza not found"] },
						},
						{ status: 400 },
					);
				}

				dbIkohzaId = ikohza.id;
			}
		}

		// 3. Determine academic type
		let finalAcademicType: "student" | "staff" | "none" = "none";
		if (
			(finalUserType === "mjiit_member" || finalUserType === "utm_member") &&
			academicType &&
			(academicType === "student" || academicType === "staff")
		) {
			finalAcademicType = academicType;
		}

		// 4. Validate external user inputs before transaction
		if (userType === "external_member") {
			// Case 1: Creating a new company
			if (!companyId && newCompanyName) {
				if (!newCompanyBranchName?.trim()) {
					return NextResponse.json(
						{
							error: "Branch name is required when creating a new company",
							details: { newCompanyBranchName: ["Branch name is required"] },
						},
						{ status: 400 },
					);
				}
				if (!newCompanyAddress?.trim()) {
					return NextResponse.json(
						{
							error: "Branch address is required when creating a new company",
							details: { newCompanyAddress: ["Branch address is required"] },
						},
						{ status: 400 },
					);
				}
			}
			// Case 2: Existing company but adding a new branch
			else if (companyId && !companyBranchId && newBranchName) {
				if (!newBranchAddress?.trim()) {
					return NextResponse.json(
						{
							error: "Branch address is required when creating a new branch",
							details: { newBranchAddress: ["Branch address is required"] },
						},
						{ status: 400 },
					);
				}
			}
			// Case 3: Existing company but no branch selected/created
			else if (companyId && !companyBranchId && !newBranchName) {
				return NextResponse.json(
					{
						error: "Please select an existing branch or create a new one",
						details: { companyBranchId: ["Branch selection is required"] },
					},
					{ status: 400 },
				);
			}
			// Case 0: No company provided at all
			else if (!companyId && !newCompanyName) {
				return NextResponse.json(
					{
						error: "Company information is required for external members",
						details: {
							companyId: [
								"Please select an existing company or create a new one",
							],
						},
					},
					{ status: 400 },
				);
			}
		}

		// 5. Wrap company/branch/user creation in a transaction
		let finalCompanyId: string | undefined = companyId;
		let finalBranchId: string | undefined = companyBranchId;

		await db.$transaction(async (tx) => {
			// Handle company/branch creation for external users
			if (userType === "external_member") {
				// Case 1: Creating a new company
				if (!companyId && newCompanyName) {
					const newCompany = await tx.company.create({
						data: {
							name: newCompanyName.trim(),
						},
						select: {
							id: true,
							name: true,
							legalName: true,
						},
					});
					finalCompanyId = newCompany.id;

					// Create branch with the provided name or default to "Main Office"
					if (newCompanyAddress) {
						const branch = await tx.companyBranch.create({
							data: {
								companyId: newCompany.id,
								name: newCompanyBranchName?.trim() || "Main Office",
								address: newCompanyAddress.trim(),
							},
							select: {
								id: true,
							},
						});
						finalBranchId = branch.id;
					}
				}
				// Case 2: Existing company but adding a new branch
				else if (companyId && !companyBranchId && newBranchName) {
					// Verify company exists before creating branch
					const existingCompany = await tx.company.findUnique({
						where: { id: companyId },
						select: { id: true },
					});

					if (!existingCompany) {
						throw new ValidationError("Company not found", {
							companyId: ["The selected company does not exist"],
						});
					}

					const newBranch = await tx.companyBranch.create({
						data: {
							companyId,
							name: newBranchName.trim(),
							address: newBranchAddress?.trim() || null,
						},
						select: {
							id: true,
							name: true,
							companyId: true,
							address: true,
							city: true,
						},
					});
					finalBranchId = newBranch.id;
				}
				// Case 3: Existing company with existing branch
				else if (companyId && companyBranchId) {
					// Verify the branch exists and belongs to the company
					const existingBranch = await tx.companyBranch.findFirst({
						where: {
							id: companyBranchId,
							companyId: companyId,
						},
						select: {
							id: true,
							companyId: true,
						},
					});

					if (!existingBranch) {
						throw new ValidationError("Invalid branch", {
							companyBranchId: [
								"The selected branch does not exist or does not belong to the selected company",
							],
						});
					}
				}
			}

			// Create User record (with pending status, NOT verified)
			await tx.user.create({
				data: {
					email,
					firstName,
					lastName,
					phone: phone.trim(),
					userType: finalUserType,
					academicType: finalAcademicType,
					userIdentifier: userIdentifier?.trim() || null,
					supervisorName:
						finalAcademicType === "student"
							? supervisorName?.trim() || null
							: null,
					status: "pending",
					authUser: {
						connect: { id: signUpResult.user.id },
					},
					// Academic organization (internal members)
					...(dbFacultyId && {
						facultyRelation: { connect: { id: dbFacultyId } },
					}),
					...(dbDepartmentId && {
						departmentRelation: { connect: { id: dbDepartmentId } },
					}),
					...(dbIkohzaId && {
						ikohza: { connect: { id: dbIkohzaId } },
					}),
					// External organization
					...(finalCompanyId && {
						companyRelation: { connect: { id: finalCompanyId } },
					}),
					...(finalBranchId && {
						companyBranch: { connect: { id: finalBranchId } },
					}),
				},
			});
		});

		// 6. Generate verification token and send email (after transaction commits)
		const verificationToken = await db.betterAuthVerification.create({
			data: {
				identifier: email,
				value: crypto.randomUUID(), // Generate unique token
				expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
				userId: signUpResult.user.id,
			},
		});

		const verificationUrl = `${env.BETTER_AUTH_URL}/api/auth/verify-email?token=${verificationToken.value}&email=${encodeURIComponent(email)}`;

		// Send welcome verification email
		await sendUserWelcomeVerification({
			email,
			name: `${firstName} ${lastName}`,
			verificationUrl,
		});

		return NextResponse.json({
			message:
				"Account created successfully. Please check your email to verify your account.",
		});
	} catch (error) {
		console.error("Registration error:", error);

		// Handle validation errors (return 400)
		if (error instanceof ValidationError) {
			return NextResponse.json(
				{
					error: error.error,
					...(error.details && { details: error.details }),
				},
				{ status: 400 },
			);
		}

		// If user already exists, clean up
		const errObj = error as { code?: string } | undefined;
		if (errObj?.code === "P2002") {
			// Unique constraint violation
			try {
				const cleanupEmail =
					typeof body?.email === "string" ? body.email : undefined;
				if (cleanupEmail) {
					await db.betterAuthUser.deleteMany({
						where: { email: cleanupEmail },
					});
				}
			} catch {
				// Ignore cleanup errors
			}
		}

		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Registration failed",
			},
			{ status: 500 },
		);
	}
}
