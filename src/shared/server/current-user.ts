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
};

/**
 * Shape the user object from session into CurrentUser
 */
function shapeUser(u: {
	appUserId?: string | null;
	email?: string;
	name?: string | null;
	image?: string | null;
	role?: string | null;
	status?: string | null;
	id?: string;
}): CurrentUser {
	return {
		appUserId: u.appUserId as string,
		email: u.email as string,
		name: (u.name ?? null) as string | null,
		image: (u.image ?? null) as string | null,
		role: (u.role ?? null) as string | null,
		status: (u.status ?? null) as string | null,
		authUserId: (u.id ?? null) as string | null,
	};
}

/**
 * Require current user in Server Components (RSC) and pages
 * Redirects to /signIn if not authenticated or appUserId is missing
 */
export async function requireCurrentUser(): Promise<CurrentUser> {
	const session = await auth();
	if (!session?.user?.appUserId) {
		redirect("/signIn");
	}
	return shapeUser(session.user);
}

/**
 * Get optional current user in Server Components (RSC) and pages
 * Returns null if not authenticated or appUserId is missing
 */
export async function getOptionalCurrentUser(): Promise<CurrentUser | null> {
	const session = await auth();
	if (!session?.user?.appUserId) {
		return null;
	}
	return shapeUser(session.user);
}

/**
 * Require current user in API routes
 * Throws an error with status 401 if not authenticated or appUserId is missing
 * This error should be caught by withAuth or error handlers
 */
export async function requireCurrentUserApi(): Promise<CurrentUser> {
	const session = await auth();
	if (!session?.user?.appUserId) {
		const err = new Error("Unauthorized") as Error & { status?: number };
		err.status = 401;
		throw err;
	}
	return shapeUser(session.user);
}
