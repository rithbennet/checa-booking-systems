import { NextResponse } from "next/server";
import { z } from "zod";
import { notifyAdminsNewUserRegistered } from "@/entities/notification/server";
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
	phone: z.string().optional(),
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
		const existingUser = await db.user.findUnique({
			where: { authUserId },
		});

		if (existingUser) {
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
				const newCompany = await createCompany({
					name: data.newCompanyName.trim(),
					address: data.newCompanyAddress?.trim(),
				});
				finalCompanyId = newCompany.id;

				// If we created a company with an address, get the main branch
				if (data.newCompanyAddress) {
					const mainBranch = await db.companyBranch.findFirst({
						where: { companyId: newCompany.id },
						select: { id: true },
					});
					finalBranchId = mainBranch?.id;
				}
			}
			// Case 2: Existing company but adding a new branch
			else if (data.companyId && !data.companyBranchId && data.newBranchName) {
				const newBranch = await createCompanyBranch({
					companyId: data.companyId,
					name: data.newBranchName.trim(),
					address: data.newBranchAddress?.trim(),
				});
				finalBranchId = newBranch.id;
			}
		}

		// Determine academic type based on user type
		let academicType: "student" | "staff" | "none" = "none";
		if (
			(data.userType === "mjiit_member" || data.userType === "utm_member") &&
			data.academicType
		) {
			academicType = data.academicType;
		}

		// Create User record
		const newUser = await db.user.create({
			data: {
				email,
				firstName: data.firstName,
				lastName: data.lastName,
				phone: data.phone || null,
				profileImageUrl: sessionImage || null,
				userType: data.userType,
				academicType,
				userIdentifier: data.userIdentifier || null,
				supervisorName:
					academicType === "student" ? data.supervisorName || null : null,
				status: "pending", // New users start as pending for admin approval
				emailVerifiedAt: new Date(), // OAuth emails are verified by the provider
				authUser: {
					connect: { id: authUserId },
				},
				// Academic organization (internal members)
				...(data.facultyId && {
					facultyRelation: { connect: { id: data.facultyId } },
				}),
				...(data.departmentId && {
					departmentRelation: { connect: { id: data.departmentId } },
				}),
				...(data.ikohzaId && {
					ikohza: { connect: { id: data.ikohzaId } },
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

		// Also update the BetterAuthUser name if it's different
		const fullName = `${data.firstName} ${data.lastName}`;
		if (session.user.name !== fullName) {
			await db.betterAuthUser.update({
				where: { id: authUserId },
				data: { name: fullName },
			});
		}

		// Notify admins of new OAuth user registration
		const admins = await db.user.findMany({
			where: { userType: "lab_administrator", status: "active" },
			select: { id: true },
		});

		if (admins.length > 0) {
			await notifyAdminsNewUserRegistered({
				adminIds: admins.map((a) => a.id),
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
