import { getSession } from "./better-auth/server";
export async function auth() {
	const session = await getSession();
	if (!session) {
		return null;
	}

	// Session already includes role and status from customSession plugin
	// These are cached in cookies, so no DB query needed!
	return {
		user: {
			...session.user,
			// Role and status are already in session.user from customSession plugin
			role: (session.user as { role?: string | null }).role ?? null,
			status: (session.user as { status?: string | null }).status ?? null,
		},
		expires: session.session.expiresAt.toISOString(),
	};
}
