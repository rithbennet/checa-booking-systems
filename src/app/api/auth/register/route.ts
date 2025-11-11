import { NextResponse } from "next/server";
import { auth } from "@/shared/server/better-auth/config";
import { db } from "@/shared/server/db";

/**
 * Custom registration endpoint that:
 * 1. Creates Better Auth user via Better Auth API
 * 2. Creates our User model record with additional fields
 */
export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { email, password, firstName, lastName, userType } = body;

		if (!email || !password || !firstName || !lastName || !userType) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		// 1. Create Better Auth user
		const signUpResult = await auth.api.signUpEmail({
			body: {
				email,
				password,
				name: `${firstName} ${lastName}`,
			},
		});

		if (!signUpResult.data) {
			return NextResponse.json(
				{
					error: signUpResult.error?.message || "Failed to create user",
				},
				{ status: 400 },
			);
		}

		// 2. Mark email as verified
		await db.betterAuthUser.update({
			where: { email },
			data: { emailVerified: true },
		});

		// 3. Create our User record
		await db.user.create({
			data: {
				email,
				firstName,
				lastName,
				userType: userType as
					| "utm_member"
					| "external_member"
					| "lab_administrator",
				status: "pending", // New users start as pending
				emailVerifiedAt: new Date(),
			},
		});

		return NextResponse.json({
			message: "Account created successfully. Please wait for admin approval.",
		});
	} catch (error) {
		console.error("Registration error:", error);

		// If user already exists, clean up
		if (error && typeof error === "object" && "code" in error) {
			if (error.code === "P2002") {
				// Unique constraint violation
				try {
					await db.betterAuthUser.deleteMany({
						where: { email: body?.email },
					});
				} catch {
					// Ignore cleanup errors
				}
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
