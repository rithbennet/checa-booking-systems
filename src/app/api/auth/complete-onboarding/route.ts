import { NextResponse } from "next/server";
import { getSession } from "@/shared/server/better-auth/server";
import { db } from "@/shared/server/db";

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

		// Parse request body
		const body = await request.json();
		const firstName =
			typeof body?.firstName === "string" ? body.firstName.trim() : undefined;
		const lastName =
			typeof body?.lastName === "string" ? body.lastName.trim() : undefined;
		const userType =
			typeof body?.userType === "string" ? body.userType : undefined;

		if (!firstName || !lastName || !userType) {
			return NextResponse.json(
				{ error: "Missing required fields: firstName, lastName, userType" },
				{ status: 400 },
			);
		}

		// Validate userType
		const validUserTypes = ["mjiit_member", "utm_member", "external_member"];
		if (!validUserTypes.includes(userType)) {
			return NextResponse.json({ error: "Invalid user type" }, { status: 400 });
		}

		// Create User record
		const newUser = await db.user.create({
			data: {
				email,
				firstName,
				lastName,
				userType: userType as "mjiit_member" | "utm_member" | "external_member",
				status: "pending", // New users start as pending for admin approval
				emailVerifiedAt: new Date(), // OAuth emails are verified by the provider
				authUser: {
					connect: { id: authUserId },
				},
			},
		});

		// Also update the BetterAuthUser name if it's different
		const fullName = `${firstName} ${lastName}`;
		if (session.user.name !== fullName) {
			await db.betterAuthUser.update({
				where: { id: authUserId },
				data: { name: fullName },
			});
		}

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
