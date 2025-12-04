import { NextResponse } from "next/server";
import { notifyAdminsNewUserRegistered } from "@/entities/notification/server";
import { db } from "@/shared/server/db";

/**
 * Email Verification Handler
 * Called when user clicks verification link in welcome email
 */
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const token = searchParams.get("token");
		const email = searchParams.get("email");

		if (!token || !email) {
			return NextResponse.redirect(
				new URL("/signIn?error=invalid_verification_link", request.url),
			);
		}

		// 1. Find and validate verification token
		const verification = await db.betterAuthVerification.findFirst({
			where: {
				identifier: email,
				value: token,
				expiresAt: {
					gte: new Date(),
				},
			},
			include: {
				user: true,
			},
		});

		if (!verification || !verification.user || !verification.userId) {
			return NextResponse.redirect(
				new URL("/signIn?error=invalid_or_expired_token", request.url),
			);
		}

		// 2. Mark Better Auth user as verified
		await db.betterAuthUser.update({
			where: { id: verification.userId },
			data: { emailVerified: true },
		});

		// 3. Mark our User record as verified
		await db.user.update({
			where: { email },
			data: { emailVerifiedAt: new Date() },
		});

		// 4. Delete the verification token (one-time use)
		await db.betterAuthVerification.delete({
			where: { id: verification.id },
		});

		// 5. Get all admins to notify
		const admins = await db.user.findMany({
			where: { userType: "lab_administrator", status: "active" },
			select: { id: true },
		});

		// 6. Get user details for notification
		const user = await db.user.findUnique({
			where: { email },
			select: {
				id: true,
				firstName: true,
				lastName: true,
				email: true,
				userType: true,
			},
		});

		if (user && admins.length > 0) {
			// Notify admins of new verified user
			await notifyAdminsNewUserRegistered({
				adminIds: admins.map((a) => a.id),
				userId: user.id,
				userName: `${user.firstName} ${user.lastName}`,
				userEmail: user.email,
				userType: user.userType,
			});
		}

		// 7. Redirect to sign-in with success message
		return NextResponse.redirect(
			new URL(
				"/signIn?verified=true&message=Email verified! Please sign in and wait for admin approval.",
				request.url,
			),
		);
	} catch (error) {
		console.error("Email verification error:", error);
		return NextResponse.redirect(
			new URL("/signIn?error=verification_failed", request.url),
		);
	}
}
