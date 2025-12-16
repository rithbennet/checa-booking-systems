import { NextResponse } from "next/server";
import { z } from "zod";
import { notifyAdminsNewUserRegistered } from "@/entities/notification/server";
import {
	createUser,
	getActiveAdminIds,
	userExistsByAuthId,
} from "@/entities/user/server";
import {
	createCompany,
	createCompanyBranch,
} from "@/entities/user/server/onboarding-options-repository";
import { invalidateUserSessionCache } from "@/shared/server/better-auth/config";
import { getSession } from "@/shared/server/better-auth/server";
import { db } from "@/shared/server/db";

// Schema for validating onboarding request body
const onboardingRequestSchema = z.object({
	firstName: z.string().min(1).trim(),
	lastName: z.string().min(1).trim(),
	phone: z.string().min(1, "Phone number is required").trim(),
	userType: z.enum(["mjiit_member", "utm_member", "external_member"]),
	academicType: z.enum(["student", "staff", "none"]).optional(),
	userIdentifier: z.string().optional(),
	supervisorName: z.string().optional(),
	facultyId: z.string().uuid().optional(),
	departmentId: z.string().uuid().optional(),
	ikohzaId: z.string().uuid().optional(),
	companyId: z.string().uuid().optional(),
	companyBranchId: z.string().uuid().optional(),
	newCompanyName: z.string().optional(),
	newCompanyAddress: z.string().optional(),
	newCompanyBranchName: z.string().optional(),
	newBranchName: z.string().optional(),
	newBranchAddress: z.string().optional(),
});

/**
 * Complete onboarding for OAuth users
 * Creates the User record after OAuth sign-in
 */
export async function POST(request: Request) {
	try {
		// Get current session
		const session = await getSession();
		if (!session?.user) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const authUserId = session.user.id;
		const email = session.user.email;
		const sessionImage = session.user.image;

		if (!authUserId || !email) {
			return NextResponse.json({ error: "Invalid session" }, { status: 400 });
		}

		// Check if user already has a User record
		if (await userExistsByAuthId(authUserId)) {
			return NextResponse.json(
				{ error: "User already completed onboarding" },
				{ status: 400 },
			);
		}

		// Parse and validate request body
		const body = await request.json();
		const parseResult = onboardingRequestSchema.safeParse(body);

		if (!parseResult.success) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: parseResult.error.flatten().fieldErrors,
				},
				{ status: 400 },
			);
		}

		const data = parseResult.data;

		// Handle new company creation for external users
		let finalCompanyId = data.companyId;
		let finalBranchId = data.companyBranchId;

		if (data.userType === "external_member") {
			// Case 1: Creating a new company
			if (!data.companyId && data.newCompanyName) {
				// Require branch name for new company
				if (!data.newCompanyBranchName?.trim()) {
					return NextResponse.json(
						{
							error: "Branch name is required when creating a new company",
							details: { newCompanyBranchName: ["Branch name is required"] },
						},
						{ status: 400 },
					);
				}
				// Require address for new company
				if (!data.newCompanyAddress?.trim()) {
					return NextResponse.json(
						{
							error: "Branch address is required when creating a new company",
							details: { newCompanyAddress: ["Branch address is required"] },
						},
						{ status: 400 },
					);
				}
				const newCompany = await createCompany({
					name: data.newCompanyName.trim(),
					address: data.newCompanyAddress.trim(),
					branchName: data.newCompanyBranchName.trim(),
				});
				finalCompanyId = newCompany.id;
				// Branch ID is returned directly from createCompany if branch was created
				finalBranchId = newCompany.branchId;
			}
			// Case 2: Existing company but adding a new branch
			else if (data.companyId && !data.companyBranchId && data.newBranchName) {
				// Require address for new branch
				if (!data.newBranchAddress?.trim()) {
					return NextResponse.json(
						{
							error: "Branch address is required when creating a new branch",
							details: { newBranchAddress: ["Branch address is required"] },
						},
						{ status: 400 },
					);
				}
				const newBranch = await createCompanyBranch({
					companyId: data.companyId,
					name: data.newBranchName.trim(),
					address: data.newBranchAddress.trim(),
				});
				finalBranchId = newBranch.id;
			}
			// Case 3: Existing company but no branch selected/created
			else if (data.companyId && !data.companyBranchId && !data.newBranchName) {
				return NextResponse.json(
					{
						error: "Please select an existing branch or create a new one",
						details: { companyBranchId: ["Branch selection is required"] },
					},
					{ status: 400 },
				);
			}
		}

		// Determine academic type based on user type
		let academicType: "student" | "staff" | "none" = "none";
		if (data.userType === "mjiit_member" || data.userType === "utm_member") {
			// Require academicType for internal members
			if (!data.academicType || data.academicType === "none") {
				return NextResponse.json(
					{
						error:
							"Academic role (student or staff) is required for institutional members",
						details: {
							academicType: [
								"Please select whether you are a student or staff",
							],
						},
					},
					{ status: 400 },
				);
			}
			academicType = data.academicType;

			// Department is required for all internal members
			if (!data.departmentId) {
				return NextResponse.json(
					{
						error: "Department selection is required for institutional members",
						details: { departmentId: ["Please select your department"] },
					},
					{ status: 400 },
				);
			}

			// For MJIIT members, also require ikohzaId
			if (data.userType === "mjiit_member" && !data.ikohzaId) {
				return NextResponse.json(
					{
						error: "iKohza selection is required for MJIIT members",
						details: { ikohzaId: ["Please select your iKohza"] },
					},
					{ status: 400 },
				);
			}
		}

		// Create User record
		const newUser = await createUser({
			email,
			firstName: data.firstName,
			lastName: data.lastName,
			phone: data.phone,
			userType: data.userType,
			academicType,
			userIdentifier: data.userIdentifier || null,
			supervisorName:
				academicType === "student" ? data.supervisorName || null : null,
			authUserId,
			profileImageUrl: sessionImage || null,
			emailVerifiedAt: new Date(), // OAuth emails are verified by the provider
			facultyId: data.facultyId,
			departmentId: data.departmentId,
			ikohzaId: data.ikohzaId,
			companyId: finalCompanyId,
			companyBranchId: finalBranchId,
		});

		// Also update the BetterAuthUser name if it's different
		const fullName = `${data.firstName} ${data.lastName}`;
		if (session.user.name !== fullName) {
			await db.betterAuthUser.update({
				where: { id: authUserId },
				data: { name: fullName },
			});
		}

		// Notify admins of new OAuth user registration
		const adminIds = await getActiveAdminIds();

		if (adminIds.length > 0) {
			await notifyAdminsNewUserRegistered({
				adminIds,
				userId: newUser.id,
				userName: fullName,
				userEmail: email,
				userType: data.userType,
			});
		}

		// Invalidate session cache so needsOnboarding flips to false
		invalidateUserSessionCache(authUserId);

		return NextResponse.json({
			message: "Onboarding completed successfully",
			userId: newUser.id,
		});
	} catch (error) {
		console.error("Onboarding error:", error);

		// Handle unique constraint violation
		const errObj = error as { code?: string } | undefined;
		if (errObj?.code === "P2002") {
			return NextResponse.json(
				{ error: "A user with this email already exists" },
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Onboarding failed" },
			{ status: 500 },
		);
	}
}
