import { NextResponse } from "next/server";
import { auth } from "@/shared/server/better-auth/config";
import { db } from "@/shared/server/db";

/**
 * Register a new user:
 * - creates a Better Auth user
 * - creates an application User record
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
        { status: 400 }
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

    // better-auth returns shapes like { token: string | null, user: {...} }
    if (!signUpResult || !signUpResult.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 400 }
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
      { status: 500 }
    );
  }
}
