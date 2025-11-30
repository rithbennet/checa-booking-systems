/**
 * Shared current user helpers for Server Components and API routes
 */

import { redirect } from "next/navigation";
import { auth } from "./auth";

export type CurrentUser = {
	appUserId: string;
	email: string;
	name: string | null;
	image: string | null;
	role: string | null;
	status: string | null;
	authUserId: string | null; // BetterAuth id for reference
	needsOnboarding?: boolean; // OAuth users without User record
};

/**
 * Shape the user object from session into CurrentUser
 * Uses id as fallback when appUserId is missing
 */
function shapeUser(u: {
	appUserId?: string | null;
	email?: string;
	name?: string | null;
	image?: string | null;
	role?: string | null;
	status?: string | null;
	id?: string;
	needsOnboarding?: boolean;
}): CurrentUser {
	// Use appUserId if available, otherwise fallback to id (BetterAuth user id)
	// This ensures we always have a non-null identifier
	const appUserId = u.appUserId ?? u.id;

	if (!appUserId) {
		throw new Error("Missing both appUserId and id in user session");
	}

	return {
		appUserId: appUserId,
		email: u.email as string,
		name: (u.name ?? null) as string | null,
		image: (u.image ?? null) as string | null,
		role: (u.role ?? null) as string | null,
		status: (u.status ?? null) as string | null,
		authUserId: (u.id ?? null) as string | null,
		needsOnboarding: u.needsOnboarding ?? false,
	};
}

/**
 * Require current user in Server Components (RSC) and pages
 * Redirects to /signIn if not authenticated or both appUserId and id are missing
 * Redirects to /onboarding if user needs to complete onboarding (OAuth users without User record)
 * Uses id as fallback when appUserId is missing to ensure a non-null identifier
 */
export async function requireCurrentUser(): Promise<CurrentUser> {
	const session = await auth();
	console.log("[requireCurrentUser] session = ", session);

	if (!session || !session.user) {
		console.warn("[requireCurrentUser] no session or user, redirecting");
		redirect("/signIn");
	}

	console.log("[requireCurrentUser] user", session.user);

	// Check if user needs onboarding (OAuth user without User record)
	const user = session.user as {
		needsOnboarding?: boolean;
		appUserId?: string | null;
		id?: string;
	};
	if (user.needsOnboarding) {
		console.log("[requireCurrentUser] user needs onboarding, redirecting");
		redirect("/onboarding");
	}

	// Ensure we have at least one identifier (appUserId or id)
	if (!user.appUserId && !user.id) {
		console.warn("[requireCurrentUser] missing appUserId/id", session.user);
		redirect("/signIn");
	}

	// shapeUser will use id as fallback if appUserId is missing
	// This ensures appUserId is always a non-null string
	return shapeUser(session.user);
}

/**
 * Get optional current user in Server Components (RSC) and pages
 * Returns null if not authenticated or both appUserId and id are missing
 * Uses id as fallback when appUserId is missing
 */
export async function getOptionalCurrentUser(): Promise<CurrentUser | null> {
	const session = await auth();
	if (!session?.user) {
		return null;
	}
	// Need at least one identifier (appUserId or id)
	if (!session.user.appUserId && !session.user.id) {
		return null;
	}
	return shapeUser(session.user);
}

/**
 * Require current user in API routes
 * Throws an error with status 401 if not authenticated or both appUserId and id are missing
 * Uses id as fallback when appUserId is missing
 * This error should be caught by withAuth or error handlers
 */
export async function requireCurrentUserApi(): Promise<CurrentUser> {
	const session = await auth();
	if (!session?.user) {
		const err = new Error("Unauthorized") as Error & { status?: number };
		err.status = 401;
		throw err;
	}
	// Need at least one identifier (appUserId or id)
	if (!session.user.appUserId && !session.user.id) {
		const err = new Error("Unauthorized") as Error & { status?: number };
		err.status = 401;
		throw err;
	}
	return shapeUser(session.user);
}
