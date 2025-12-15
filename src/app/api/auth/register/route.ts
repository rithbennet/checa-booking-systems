import { NextResponse } from "next/server";
import { sendUserWelcomeVerification } from "@/entities/notification/server";
import {
	createUser,
	lookupDepartmentById,
	lookupFacultyById,
	lookupIkohzaById,
} from "@/entities/user/server";
import {
	createCompany,
	createCompanyBranch,
} from "@/entities/user/server/onboarding-options-repository";
import { env } from "@/env";
import { auth } from "@/shared/server/better-auth/config";
import { db } from "@/shared/server/db";

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

		// 2. Handle company/branch creation for external users
		let finalCompanyId: string | undefined = companyId;
		let finalBranchId: string | undefined = companyBranchId;

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
				const newCompany = await createCompany({
					name: newCompanyName.trim(),
					address: newCompanyAddress.trim(),
					branchName: newCompanyBranchName.trim(),
				});
				finalCompanyId = newCompany.id;
				// Branch ID is returned directly from createCompany if branch was created
				finalBranchId = newCompany.branchId;
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
				const newBranch = await createCompanyBranch({
					companyId,
					name: newBranchName.trim(),
					address: newBranchAddress.trim(),
				});
				finalBranchId = newBranch.id;
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
		}

		// 3. Look up faculty/department/ikohza for institutional users
		let dbFacultyId: string | undefined;
		let dbDepartmentId: string | undefined;
		let dbIkohzaId: string | undefined;
		let finalUserType = userType as
			| "utm_member"
			| "external_member"
			| "mjiit_member"
			| "lab_administrator";

		if (
			(userType === "utm_member" || userType === "mjiit_member") &&
			facultyId
		) {
			// Look up faculty by ID
			const faculty = await lookupFacultyById(facultyId);
			if (faculty) {
				dbFacultyId = faculty.id;
				// If faculty is MJIIT, update userType
				if (faculty.code.toUpperCase() === "MJIIT") {
					finalUserType = "mjiit_member";
				}
			}

			// Look up department if provided
			if (departmentId && dbFacultyId) {
				const dept = await lookupDepartmentById(departmentId, dbFacultyId);
				if (dept) dbDepartmentId = dept.id;
			}

			// Look up ikohza if provided (for MJIIT)
			if (ikohzaId && dbFacultyId) {
				const ikohza = await lookupIkohzaById(ikohzaId, dbFacultyId);
				if (ikohza) dbIkohzaId = ikohza.id;
			}
		}

		// 4. Determine academic type
		let finalAcademicType: "student" | "staff" | "none" = "none";
		if (
			(finalUserType === "mjiit_member" || finalUserType === "utm_member") &&
			academicType &&
			(academicType === "student" || academicType === "staff")
		) {
			finalAcademicType = academicType;
		}

		// 5. Create our User record (with pending status, NOT verified)
		await createUser({
			email,
			firstName,
			lastName,
			phone: phone.trim(),
			userType: finalUserType,
			academicType: finalAcademicType,
			userIdentifier: userIdentifier?.trim() || null,
			supervisorName:
				finalAcademicType === "student" ? supervisorName?.trim() || null : null,
			authUserId: signUpResult.user.id,
			facultyId: dbFacultyId,
			departmentId: dbDepartmentId,
			ikohzaId: dbIkohzaId,
			companyId: finalCompanyId,
			companyBranchId: finalBranchId,
		});

		// 6. Generate verification token and send email
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
