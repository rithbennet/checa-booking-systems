import { NextResponse } from "next/server";
import { auth } from "./auth";

/**
 * Security policies and RBAC enforcement
 */

/**
 * Get current authenticated user session
 * Throws 401 if not authenticated or appUserId is missing
 */
export async function requireAuth() {
	const session = await auth();

	if (!session?.user?.appUserId) {
		throw new Error("Unauthorized");
	}

	return {
		userId: session.user.appUserId, // This is the app User.id (FK-safe)
		userEmail: session.user.email,
		userType: session.user.role ?? "",
		userStatus: session.user.status as
			| "active"
			| "pending"
			| "inactive"
			| "rejected"
			| "suspended"
			| null,
		authUserId: session.user.id, // BetterAuth id (for reference only)
	};
}

/**
 * Require admin role
 * Throws 403 if not admin
 */
export async function requireAdmin() {
	const user = await requireAuth();

	if (user.userType !== "lab_administrator") {
		throw new Error("Forbidden: Admin access required");
	}

	return {
		adminId: user.userId, // app User.id
		userEmail: user.userEmail,
	};
}

/**
 * Error response helpers for API routes
 */
export function unauthorized(message = "Unauthorized") {
	return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
	return NextResponse.json({ error: message }, { status: 403 });
}

export function badRequest(message = "Bad request") {
	return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Not found") {
	return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = "Internal server error") {
	return NextResponse.json({ error: message }, { status: 500 });
}
