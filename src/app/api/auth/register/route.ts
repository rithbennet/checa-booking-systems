import { NextResponse } from "next/server";
import { sendUserWelcomeVerification } from "@/entities/notification/server";
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

		if (!email || !password || !firstName || !lastName || !userType) {
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

		// 2. Create our User record (with pending status, NOT verified)
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
				// Do NOT set emailVerifiedAt yet
				authUser: {
					connect: { email },
				},
			},
		});

		// 3. Generate verification token and send email
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
